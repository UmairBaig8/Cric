alter table public.registrations
  add column if not exists employee_id text;

update public.registrations
set employee_id = upper(email)
where employee_id is null;

alter table public.registrations
  alter column employee_id set not null;

alter table public.registrations
  rename column department to squad;

create unique index if not exists registrations_employee_id_uidx on public.registrations (employee_id);