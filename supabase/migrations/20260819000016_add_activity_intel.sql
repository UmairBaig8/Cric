-- Activity intelligence: audit public registration events + expose identity correlation.
alter table public.admin_audit alter column actor_email drop not null;

-- Trigger captures every registration insert/update/delete (public + admin),
-- so the committee can always see who added/changed player data.
create or replace function public.audit_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text;
  changed jsonb;
begin
  actor := nullif(current_setting('request.jwt.claims', true)::json ->> 'email', '');

  if tg_op = 'INSERT' then
    insert into public.admin_audit (actor_email, action, target_id, detail)
    values (actor, 'registration.add', new.id,
      jsonb_build_object('name', new.name, 'email', new.email,
        'employee_id', new.employee_id, 'visitor_id', new.visitor_id));
    return new;
  elsif tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(k, v), '{}'::jsonb)
      into changed
      from jsonb_each(to_jsonb(new)) as t(k, v)
      join jsonb_each(to_jsonb(old)) as o(k, v) using (k)
      where v is distinct from o.v and k <> 'updated_at';
    insert into public.admin_audit (actor_email, action, target_id, detail)
    values (actor, 'registration.update', new.id,
      jsonb_build_object('changed', changed));
    return new;
  else
    insert into public.admin_audit (actor_email, action, target_id, detail)
    values (actor, 'registration.delete', old.id,
      jsonb_build_object('name', old.name, 'email', old.email));
    return old;
  end if;
end;
$$;

drop trigger if exists audit_registration_trg on public.registrations;
create trigger audit_registration_trg
  after insert or update or delete on public.registrations
  for each row execute function public.audit_registration();

-- Read API: latest audit entries, admin only.
create or replace function public.admin_audit_log(max_rows int default 100)
returns table (id bigint, actor_email text, action text, target_id uuid, detail jsonb, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.id, a.actor_email, a.action, a.target_id, a.detail, a.created_at
  from public.admin_audit a
  where public.is_admin()
  order by a.id desc
  limit max_rows;
$$;

grant execute on function public.admin_audit_log(int) to authenticated;

-- Identity correlation: every registration joined to its browsing session
-- (geo, device, ip hash, visit number) plus anomaly flags.
create or replace function public.admin_registration_intel()
returns table (
  id uuid, name text, email text, created_at timestamptz, visitor_id text,
  city text, region text, country text, isp text, device text, browser text, os text,
  ip_hash text, visit_number int,
  same_ip_regs bigint, dup_email bigint, has_session boolean
)
language sql
security definer
set search_path = public
as $$
  select
    r.id, r.name, r.email, r.created_at, r.visitor_id,
    s.city, s.region, s.country, s.isp, s.device, s.browser, s.os,
    s.ip_hash, s.visit_number,
    (
      select count(distinct r2.id)
      from public.registrations r2
      join public.sessions s2 on s2.visitor_id = r2.visitor_id
      join public.sessions sm on sm.visitor_id = r.visitor_id
      where s2.ip_hash is not null
        and s2.ip_hash = sm.ip_hash
        and r2.id <> r.id
    ) as same_ip_regs,
    (
      select count(*)
      from public.registrations r3
      where lower(r3.email) = lower(r.email) and r3.id <> r.id
    ) as dup_email,
    s.visitor_id is not null as has_session
  from public.registrations r
  left join lateral (
    select * from public.sessions s
    where s.visitor_id = r.visitor_id
    order by s.last_seen desc
    limit 1
  ) s on true
  where public.is_admin()
  order by r.created_at desc;
$$;

grant execute on function public.admin_registration_intel() to authenticated;