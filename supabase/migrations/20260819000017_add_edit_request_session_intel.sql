-- edit requests become attributable: capture the submitting browser's visitor_id
alter table public.player_edit_requests add column if not exists visitor_id text;

-- per-request session intel, mirroring admin_registration_intel,
-- plus the cross-account signal: OTHER names seen on the same connection
-- (same ip_hash or fingerprint) across edit requests AND registrations.
create or replace function public.admin_edit_request_intel()
returns table (
  id uuid,
  player_name text,
  status text,
  created_at timestamp with time zone,
  visitor_id text,
  city text,
  region text,
  country text,
  isp text,
  device text,
  browser text,
  os text,
  ip_hash text,
  fingerprint text,
  visit_number integer,
  has_session boolean,
  other_names_on_connection bigint
)
language sql
security definer
set search_path = public
as $$
  select
    r.id,
    r.player_name,
    r.status,
    r.created_at,
    r.visitor_id,
    s.city, s.region, s.country, s.isp, s.device, s.browser, s.os,
    s.ip_hash, s.fingerprint, s.visit_number,
    s.visitor_id is not null as has_session,
    (
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
    ) + (
      select count(distinct reg.id)
      from public.registrations reg
      join public.sessions sreg on sreg.visitor_id = reg.visitor_id
      join public.sessions sm on sm.visitor_id = r.visitor_id
      where lower(reg.name) <> lower(r.player_name)
        and (
          (sm.ip_hash is not null and sreg.ip_hash = sm.ip_hash)
          or (sm.fingerprint is not null and sreg.fingerprint = sm.fingerprint)
        )
    ) as other_names_on_connection
  from public.player_edit_requests r
  left join lateral (
    select *
    from public.sessions s
    where s.visitor_id = r.visitor_id
    order by s.last_seen desc
    limit 1
  ) s on true
  where public.is_admin()
  order by r.created_at desc;
$$;

grant execute on function public.admin_edit_request_intel() to authenticated;