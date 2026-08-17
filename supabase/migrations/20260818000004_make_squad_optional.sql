-- squad (formerly department) is optional in the UI.
-- Drop the NOT NULL + length check that rejects empty/null squad.
alter table public.registrations
  drop constraint if exists registrations_department_check;

alter table public.registrations
  alter column squad drop not null;

-- Keep a sane upper bound but allow empty/null values.
alter table public.registrations
  add constraint registrations_squad_check check (squad is null or char_length(squad) between 2 and 120);