create table if not exists public.settings (
  id integer primary key check (id = 1),
  registration_open timestamptz,
  registration_deadline timestamptz,
  player_capacity integer not null default 128,
  total_teams integer not null default 16,
  total_matches integer not null default 24,
  champion text,
  updated_at timestamptz not null default now()
);

insert into public.settings (id, registration_open, registration_deadline, player_capacity, total_teams, total_matches, champion)
values (1, now(), now() + interval '15 days 8 hours 42 minutes 33 seconds', 128, 16, 24, null)
on conflict (id) do nothing;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '',
  sort_order integer not null default 0
);

insert into public.teams (name, icon, sort_order) values
  ('THUNDER', '⚡', 1),
  ('TITANS', '◈', 2),
  ('WARRIORS', '✦', 3),
  ('STRIKERS', '◉', 4),
  ('ROYALS', '♛', 5),
  ('MAVERICKS', '◆', 6)
on conflict do nothing;

alter table public.settings enable row level security;
alter table public.teams enable row level security;

drop policy if exists "Anyone can read settings" on public.settings;
create policy "Anyone can read settings" on public.settings for select to anon, authenticated using (true);
drop policy if exists "Anyone can read teams" on public.teams;
create policy "Anyone can read teams" on public.teams for select to anon, authenticated using (true);

create or replace function public.registrations_count()
returns bigint
language sql
security definer
set search_path = public
as $$ select count(*) from public.registrations $$;

revoke all on function public.registrations_count() from public;
grant execute on function public.registrations_count() to anon, authenticated;