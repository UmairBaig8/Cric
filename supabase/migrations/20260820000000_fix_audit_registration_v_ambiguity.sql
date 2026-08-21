-- Fix: column reference "v" ambiguous in audit_registration() UPDATE branch.
-- Both jsonb_each aliases (t(k,v) / o(k,v)) expose a column named v, so the
-- unqualified reference raised 42702 on every UPDATE of registrations.
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
    select coalesce(jsonb_object_agg(k, t.v), '{}'::jsonb)
      into changed
      from jsonb_each(to_jsonb(new)) as t(k, v)
      join jsonb_each(to_jsonb(old)) as o(k, v) using (k)
      where t.v is distinct from o.v and k <> 'updated_at';
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
