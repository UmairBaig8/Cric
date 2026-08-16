alter table public.registrations
  add column if not exists employee_id text;

alter table public.registrations
  rename column department to squad;

create unique index if not exists registrations_employee_id_uidx on public.registrations (employee_id);