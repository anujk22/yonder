-- Accessibility checks: "Is the step-free entrance or elevator working?" answered yes/no/unsure.
do $$
declare v_name text;
begin
  for v_name in
    select conname from pg_catalog.pg_constraint
    where conrelid = 'public.pilot_requests'::regclass and contype = 'c'
      and pg_catalog.pg_get_constraintdef(oid) like '%open_now%'
  loop
    execute pg_catalog.format('alter table public.pilot_requests drop constraint %I', v_name);
  end loop;
end;
$$;
alter table public.pilot_requests
  add constraint pilot_question_kind check (question_kind in ('open_now', 'queue', 'availability', 'accessibility')),
  add constraint pilot_answer_shape check (
    answer is null or answer = 'unsure'
    or (question_kind in ('open_now', 'availability', 'accessibility') and answer in ('yes', 'no'))
    or (question_kind = 'queue' and answer ~ '^(0|[1-9][0-9]?|1[0-9][0-9]|2[0-3][0-9]|240)$')
  );

-- Yonder Plus. Rows are written only by the RevenueCat webhook (service role), never by clients.
create table public.plus_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.plus_members enable row level security;
revoke all on public.plus_members from public, anon, authenticated;
grant select on public.plus_members to authenticated;
grant all on public.plus_members to service_role;
create policy plus_members_self on public.plus_members for select to authenticated
  using (user_id = (select auth.uid()));

-- A null expiry is a non-expiring entitlement.
create function public.has_plus(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.plus_members
    where user_id = p_user and (expires_at is null or expires_at > pg_catalog.clock_timestamp()));
$$;
revoke execute on function public.has_plus(uuid) from public, anon, authenticated;

-- Plus adds 1 and 2 hour windows and raises the open-check limit from 3 to 10.
create or replace function public.pilot_create_request(
  p_place_name text, p_latitude double precision, p_longitude double precision,
  p_landmark text, p_question_kind text, p_deadline_minutes integer
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_plus boolean;
  v_limit integer;
  v_id uuid;
begin
  if v_user is null or not exists (
    select 1 from public.pilot_members where user_id = v_user and active for update
  ) then raise exception 'Pilot access required'; end if;
  v_plus := public.has_plus(v_user);
  v_limit := case when v_plus then 10 else 3 end;
  if p_deadline_minutes is null or not (p_deadline_minutes in (5, 10, 15, 30)
      or (v_plus and p_deadline_minutes in (60, 120)))
  then raise exception 'Invalid deadline'; end if;
  if (select count(*) from public.pilot_requests
      where requester_id = v_user and status in ('open', 'claimed') and expires_at > pg_catalog.clock_timestamp())
      >= v_limit
  then raise exception 'Active request limit reached'; end if;

  insert into public.pilot_requests (
    requester_id, place_name, latitude, longitude, landmark, question_kind, expires_at
  ) values (
    v_user, pg_catalog.btrim(p_place_name), p_latitude, p_longitude,
    pg_catalog.btrim(p_landmark), p_question_kind,
    pg_catalog.clock_timestamp() + pg_catalog.make_interval(mins => p_deadline_minutes)
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.pilot_answer_request(p_request_id uuid, p_answer text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_request public.pilot_requests%rowtype;
  v_answer text := pg_catalog.btrim(p_answer);
  v_note text := nullif(pg_catalog.btrim(p_note), '');
begin
  if v_user is null or not exists (
    select 1 from public.pilot_members where user_id = v_user and active for update
  ) then raise exception 'Pilot access required'; end if;
  select * into v_request from public.pilot_requests where id = p_request_id for update;
  if not found or v_request.status <> 'claimed' or v_request.observer_id is distinct from v_user
     or v_request.expires_at <= pg_catalog.clock_timestamp()
  then raise exception 'Claim is unavailable'; end if;
  if exists (select 1 from public.pilot_blocks
      where (blocker_id = v_user and blocked_id = v_request.requester_id)
         or (blocker_id = v_request.requester_id and blocked_id = v_user))
  then raise exception 'Claim is unavailable'; end if;
  if v_note is not null and length(v_note) > 280 then raise exception 'Note is too long'; end if;
  if not (
    v_answer is not null and (v_answer = 'unsure'
    or (v_request.question_kind in ('open_now', 'availability', 'accessibility') and v_answer in ('yes', 'no'))
    or (v_request.question_kind = 'queue'
        and v_answer ~ '^(0|[1-9][0-9]?|1[0-9][0-9]|2[0-3][0-9]|240)$'))
  ) then raise exception 'Invalid answer'; end if;

  update public.pilot_requests
  set status = 'answered', answer = v_answer, note = v_note, answered_at = pg_catalog.clock_timestamp()
  where id = p_request_id;
end;
$$;
