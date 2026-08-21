alter table public.sessions
  add column if not exists language text,
  add column if not exists screen text;

alter table public.registrations
  add column if not exists visitor_id text;