-- Invited pilot only: owners add auth users to pilot_members with the SQL editor.
create table public.pilot_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active boolean not null default true
);

create table public.pilot_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  observer_id uuid references auth.users (id),
  place_name text not null check (length(btrim(place_name)) between 2 and 120),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  landmark text not null check (length(btrim(landmark)) <= 180),
  question_kind text not null check (question_kind in ('open_now', 'queue', 'availability')),
  status text not null default 'open' check (status in ('open', 'claimed', 'answered', 'cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null check (expires_at > created_at),
  answered_at timestamptz,
  answer text,
  note text check (length(note) <= 280),
  check (requester_id is distinct from observer_id),
  check (
    (status in ('open', 'cancelled') and observer_id is null and answered_at is null and answer is null and note is null)
    or (status = 'claimed' and observer_id is not null and answered_at is null and answer is null and note is null)
    or (status = 'answered' and observer_id is not null and answered_at is not null and answer is not null)
  ),
  check (
    answer is null or answer = 'unsure'
    or (question_kind in ('open_now', 'availability') and answer in ('yes', 'no'))
    or (question_kind = 'queue' and answer ~ '^(0|[1-9][0-9]?|1[0-9][0-9]|2[0-3][0-9]|240)$')
  )
);

create index pilot_requests_open_idx on public.pilot_requests (expires_at) where status = 'open';
create index pilot_requests_requester_idx on public.pilot_requests (requester_id, expires_at) where status in ('open', 'claimed');
create index pilot_requests_observer_idx on public.pilot_requests (observer_id, expires_at) where status = 'claimed';

create table public.pilot_reports (
  request_id uuid not null references public.pilot_requests (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('unsafe', 'spam', 'inaccurate')),
  created_at timestamptz not null default now(),
  primary key (request_id, reporter_id)
);

create table public.pilot_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index pilot_blocks_blocked_idx on public.pilot_blocks (blocked_id, blocker_id);

alter table public.pilot_members enable row level security;
alter table public.pilot_requests enable row level security;
alter table public.pilot_reports enable row level security;
alter table public.pilot_blocks enable row level security;

revoke all on public.pilot_members, public.pilot_requests, public.pilot_reports, public.pilot_blocks from public, anon, authenticated;
grant select on public.pilot_members, public.pilot_requests, public.pilot_blocks to authenticated;
grant all on public.pilot_members, public.pilot_requests, public.pilot_reports, public.pilot_blocks to service_role;

create policy pilot_members_self on public.pilot_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy pilot_blocks_involved on public.pilot_blocks for select to authenticated
  using (blocker_id = (select auth.uid()) or blocked_id = (select auth.uid()));

create policy pilot_requests_visible on public.pilot_requests for select to authenticated
  using (
    exists (select 1 from public.pilot_members m where m.user_id = (select auth.uid()) and m.active)
    and (
      requester_id = (select auth.uid())
      or (
        not exists (
          select 1 from public.pilot_blocks b
          where (b.blocker_id = (select auth.uid()) and b.blocked_id = requester_id)
             or (b.blocked_id = (select auth.uid()) and b.blocker_id = requester_id)
        )
        and (observer_id = (select auth.uid()) or (status = 'open' and expires_at > now()))
      )
    )
  );

create function public.pilot_create_request(
  p_place_name text, p_latitude double precision, p_longitude double precision,
  p_landmark text, p_question_kind text, p_deadline_minutes integer
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null or not exists (
    select 1 from public.pilot_members where user_id = v_user and active for update
  ) then raise exception 'Pilot access required'; end if;
  if p_deadline_minutes is null or p_deadline_minutes not in (5, 10, 15, 30)
  then raise exception 'Invalid deadline'; end if;
  if (select count(*) from public.pilot_requests
      where requester_id = v_user and status in ('open', 'claimed') and expires_at > pg_catalog.clock_timestamp()) >= 3
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

create function public.pilot_claim_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_request public.pilot_requests%rowtype;
begin
  if v_user is null or not exists (
    select 1 from public.pilot_members where user_id = v_user and active for update
  ) then raise exception 'Pilot access required'; end if;

  select * into v_request from public.pilot_requests where id = p_request_id for update;
  if not found or v_request.status <> 'open' or v_request.expires_at <= pg_catalog.clock_timestamp()
     or v_request.requester_id = v_user
  then raise exception 'Request is unavailable'; end if;
  if exists (select 1 from public.pilot_blocks
      where (blocker_id = v_user and blocked_id = v_request.requester_id)
         or (blocker_id = v_request.requester_id and blocked_id = v_user))
  then raise exception 'Request is unavailable'; end if;
  if (select count(*) from public.pilot_requests
      where observer_id = v_user and status = 'claimed' and expires_at > pg_catalog.clock_timestamp()) >= 3
  then raise exception 'Active claim limit reached'; end if;

  update public.pilot_requests set observer_id = v_user, status = 'claimed' where id = p_request_id;
end;
$$;

create function public.pilot_release_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_request public.pilot_requests%rowtype;
begin
  if v_user is null or not exists (
    select 1 from public.pilot_members where user_id = v_user and active for update
  ) then raise exception 'Pilot access required'; end if;
  select * into v_request from public.pilot_requests where id = p_request_id for update;
  if not found or v_request.observer_id is distinct from v_user or v_request.status <> 'claimed'
     or v_request.expires_at <= pg_catalog.clock_timestamp()
  then raise exception 'Claim is unavailable'; end if;
  update public.pilot_requests set observer_id = null, status = 'open' where id = p_request_id;
end;
$$;

create function public.pilot_cancel_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_request public.pilot_requests%rowtype;
begin
  if v_user is null or not exists (
    select 1 from public.pilot_members where user_id = v_user and active for update
  ) then raise exception 'Pilot access required'; end if;
  select * into v_request from public.pilot_requests where id = p_request_id for update;
  if not found or v_request.requester_id <> v_user or v_request.status not in ('open', 'claimed')
     or v_request.expires_at <= pg_catalog.clock_timestamp()
  then raise exception 'Request cannot be cancelled'; end if;
  update public.pilot_requests set observer_id = null, status = 'cancelled' where id = p_request_id;
end;
$$;

create function public.pilot_answer_request(p_request_id uuid, p_answer text, p_note text)
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
    or (v_request.question_kind in ('open_now', 'availability') and v_answer in ('yes', 'no'))
    or (v_request.question_kind = 'queue'
        and v_answer ~ '^(0|[1-9][0-9]?|1[0-9][0-9]|2[0-3][0-9]|240)$'))
  ) then raise exception 'Invalid answer'; end if;

  update public.pilot_requests
  set status = 'answered', answer = v_answer, note = v_note, answered_at = pg_catalog.clock_timestamp()
  where id = p_request_id;
end;
$$;

create function public.pilot_report_request(p_request_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_request public.pilot_requests%rowtype;
begin
  if v_user is null or not exists (select 1 from public.pilot_members where user_id = v_user and active)
  then raise exception 'Pilot access required'; end if;
  if p_reason not in ('unsafe', 'spam', 'inaccurate') then raise exception 'Invalid report reason'; end if;
  select * into v_request from public.pilot_requests where id = p_request_id;
  if not found or not (
    v_request.requester_id = v_user
    or v_request.observer_id = v_user
    or (v_request.status = 'open' and v_request.expires_at > pg_catalog.clock_timestamp())
  ) then raise exception 'Request is unavailable'; end if;
  if v_request.requester_id <> v_user and exists (select 1 from public.pilot_blocks
      where (blocker_id = v_user and blocked_id = v_request.requester_id)
         or (blocker_id = v_request.requester_id and blocked_id = v_user))
  then raise exception 'Request is unavailable'; end if;
  insert into public.pilot_reports (request_id, reporter_id, reason) values (p_request_id, v_user, p_reason);
end;
$$;

create function public.pilot_block_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null or not exists (
    select 1 from public.pilot_members where user_id = v_user and active for update
  ) then raise exception 'Pilot access required'; end if;
  if p_user_id is null or p_user_id = v_user
     or not exists (select 1 from public.pilot_members where user_id = p_user_id and active)
     or not exists (
       select 1 from public.pilot_requests
       where (requester_id = v_user and observer_id = p_user_id)
          or (requester_id = p_user_id and (observer_id = v_user
              or (status = 'open' and expires_at > pg_catalog.clock_timestamp())))
     )
  then raise exception 'User is unavailable'; end if;
  perform id from public.pilot_requests
  where requester_id in (v_user, p_user_id) and status in ('open', 'claimed')
  order by id for update;
  insert into public.pilot_blocks (blocker_id, blocked_id) values (v_user, p_user_id)
    on conflict do nothing;
  update public.pilot_requests set observer_id = null, status = 'open'
  where status = 'claimed'
    and ((requester_id = v_user and observer_id = p_user_id)
      or (requester_id = p_user_id and observer_id = v_user));
end;
$$;

create function public.pilot_delete_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  -- Serialize deletion with this member's create/claim/answer transactions.
  perform user_id from public.pilot_members where user_id = v_user for update;
  delete from public.pilot_requests where requester_id = v_user or observer_id = v_user;
  delete from public.pilot_reports where reporter_id = v_user;
  delete from public.pilot_blocks where blocker_id = v_user or blocked_id = v_user;
  delete from public.pilot_members where user_id = v_user;
  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.pilot_create_request(text,double precision,double precision,text,text,integer),
  public.pilot_claim_request(uuid), public.pilot_release_request(uuid), public.pilot_cancel_request(uuid),
  public.pilot_answer_request(uuid,text,text), public.pilot_report_request(uuid,text),
  public.pilot_block_user(uuid), public.pilot_delete_account() from public, anon;
grant execute on function public.pilot_create_request(text,double precision,double precision,text,text,integer),
  public.pilot_claim_request(uuid), public.pilot_release_request(uuid), public.pilot_cancel_request(uuid),
  public.pilot_answer_request(uuid,text,text), public.pilot_report_request(uuid,text),
  public.pilot_block_user(uuid), public.pilot_delete_account() to authenticated;
