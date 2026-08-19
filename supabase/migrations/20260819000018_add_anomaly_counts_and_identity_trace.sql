-- alert badge: single-count anomalies across registrations and edit requests
create or replace function public.admin_anomaly_counts()
returns table (flagged_registrations bigint, flagged_requests bigint)
language sql
security definer
set search_path = public
as $$
  select
    (
      select count(*)
      from public.registrations r
      where (
        select count(distinct r2.id)
        from public.registrations r2
        join public.sessions s2 on s2.visitor_id = r2.visitor_id
        join public.sessions sm on sm.visitor_id = r.visitor_id
        where s2.ip_hash is not null and s2.ip_hash = sm.ip_hash and r2.id <> r.id
      ) > 0
      or (
        select count(*) from public.registrations r3
        where lower(r3.email) = lower(r.email) and r3.id <> r.id
      ) > 0
    ) as flagged_registrations,
    (
      select count(*)
      from public.player_edit_requests r
      where (
        select count(distinct r2.id)
        from public.player_edit_requests r2
        join public.sessions s2 on s2.visitor_id = r2.visitor_id
        join public.sessions sm on sm.visitor_id = r.visitor_id
        where r2.id <> r.id
          and lower(r2.player_name) <> lower(r.player_name)
          and (
            (sm.ip_hash is not null and s2.ip_hash = sm.ip_hash)
            or (sm.fingerprint is not null and s2.fingerprint = sm.fingerprint)
          )
      ) > 0
      or (
        select count(distinct reg.id)
        from public.registrations reg
        join public.sessions sreg on sreg.visitor_id = reg.visitor_id
        join public.sessions sm on sm.visitor_id = r.visitor_id
        where lower(reg.name) <> lower(r.player_name)
          and (
            (sm.ip_hash is not null and sreg.ip_hash = sm.ip_hash)
            or (sm.fingerprint is not null and sreg.fingerprint = sm.fingerprint)
          )
      ) > 0
    ) as flagged_requests
  where public.is_admin();
$$;

grant execute on function public.admin_anomaly_counts() to authenticated;

-- identity trace: everything linked to one connection hash
create or replace function public.admin_identity_trace(conn_hash text)
returns table (sessions jsonb, registrations jsonb, edit_requests jsonb)
language sql
security definer
set search_path = public
as $$
  select
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'visitor_id', s.visitor_id, 'started_at', s.started_at, 'last_seen', s.last_seen,
        'page_count', s.page_count, 'device', s.device, 'browser', s.browser, 'os', s.os,
        'city', s.city, 'country', s.country, 'is_active', s.is_active,
        'visit_number', s.visit_number, 'fingerprint', s.fingerprint
      ) order by s.started_at desc)
      from public.sessions s
      where s.ip_hash = conn_hash
    ), '[]'::jsonb) as sessions,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', r.name, 'email', r.email, 'created_at', r.created_at, 'visitor_id', r.visitor_id,
        'employee_id', r.employee_id
      ) order by r.created_at desc)
      from public.registrations r
      where r.visitor_id in (select s.visitor_id from public.sessions s where s.ip_hash = conn_hash)
    ), '[]'::jsonb) as registrations,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'player_name', r.player_name, 'status', r.status, 'created_at', r.created_at, 'visitor_id', r.visitor_id
      ) order by r.created_at desc)
      from public.player_edit_requests r
      where r.visitor_id in (select s.visitor_id from public.sessions s where s.ip_hash = conn_hash)
    ), '[]'::jsonb) as edit_requests
  where public.is_admin();
$$;

grant execute on function public.admin_identity_trace(text) to authenticated;