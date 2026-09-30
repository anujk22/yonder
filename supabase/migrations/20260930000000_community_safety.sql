grant usage on schema public to authenticated, service_role;

-- Shared checks are free for verified, non-anonymous email accounts.
create function public.pilot_enroll_verified_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null and not coalesce(new.is_anonymous, false) then
    insert into public.pilot_members(user_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke execute on function public.pilot_enroll_verified_user() from public, anon, authenticated;
create trigger pilot_verified_membership after insert or update of email_confirmed_at on auth.users
for each row execute function public.pilot_enroll_verified_user();
insert into public.pilot_members(user_id)
select id from auth.users where email_confirmed_at is not null and not coalesce(is_anonymous, false)
on conflict do nothing;

-- Match the public-place client filter and reject common abusive text server-side.
create function public.pilot_safe_text(p_text text)
returns boolean language sql immutable set search_path = '' as $$
  select p_text is null or (length(p_text) <= 280 and lower(p_text) !~
    '(my ex|the guy in|is john|wearing a|apartment|house|where he lives|camera|guard|security|locked|alarm|side door|follow|watch him|watch her|license plate|number plate|\m(fuck|fucking|shit|bitch|porn|rape|rapist|nazi|kill yourself|kill you|i will kill|hate you)\M)');
$$;
alter table public.pilot_requests add column hidden boolean not null default false;
update public.pilot_requests set hidden = true
where not public.pilot_safe_text(place_name) or not public.pilot_safe_text(landmark) or not public.pilot_safe_text(note);
alter table public.pilot_requests
  add constraint pilot_place_safe check (hidden or public.pilot_safe_text(place_name)),
  add constraint pilot_landmark_safe check (hidden or public.pilot_safe_text(landmark)),
  add constraint pilot_note_safe check (hidden or public.pilot_safe_text(note));

-- Quarantine preserves evidence; only an operator may review and restore/remove it.
alter table public.pilot_reports add column resolved_at timestamptz;
create function public.pilot_quarantine_report()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.pilot_requests set hidden = true where id = new.request_id;
  return new;
end;
$$;
create trigger pilot_report_quarantine after insert on public.pilot_reports
for each row execute function public.pilot_quarantine_report();

create function public.pilot_prevent_hidden_work()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and old.hidden and new.status is distinct from old.status
     and new.status in ('claimed', 'answered') then
    raise exception 'Request is unavailable pending moderation';
  end if;
  return new;
end;
$$;
create trigger pilot_hidden_work before update on public.pilot_requests
for each row execute function public.pilot_prevent_hidden_work();
revoke execute on function public.pilot_quarantine_report(), public.pilot_prevent_hidden_work() from public, anon, authenticated;

drop policy pilot_requests_visible on public.pilot_requests;
create policy pilot_requests_visible on public.pilot_requests for select to authenticated
using (
  not hidden
  and created_at >= now() - interval '30 days'
  and exists (select 1 from public.pilot_members m where m.user_id = (select auth.uid()) and m.active)
  and not exists (
    select 1 from public.pilot_blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id in (requester_id, observer_id))
       or (b.blocked_id = (select auth.uid()) and b.blocker_id in (requester_id, observer_id))
  )
  and (requester_id = (select auth.uid()) or observer_id = (select auth.uid())
    or (status = 'open' and expires_at > now()))
);

-- Schedule daily with Supabase Cron; cascades also erase each check's reports.
create function public.pilot_cleanup_expired_data()
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_deleted bigint;
begin
  delete from public.pilot_requests where created_at < pg_catalog.clock_timestamp() - interval '30 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke execute on function public.pilot_cleanup_expired_data() from public, anon, authenticated;
grant execute on function public.pilot_cleanup_expired_data() to service_role;

-- Enable the extension in Supabase before applying this migration to schedule it.
do $$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule('yonder-shared-check-retention', '0 4 * * *',
      'select public.pilot_cleanup_expired_data()');
  else
    raise notice 'Enable Supabase Cron and schedule pilot_cleanup_expired_data daily; cleanup is not scheduled yet.';
  end if;
end;
$$;
