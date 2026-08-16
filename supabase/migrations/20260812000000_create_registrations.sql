create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  department text not null check (char_length(department) between 2 and 120),
  player_type text not null check (player_type in ('Batter', 'Bowler', 'All-rounder', 'Wicketkeeper-batter')),
  batting_style text not null check (batting_style in ('Right-hand batter', 'Left-hand batter')),
  bowling_style text not null check (bowling_style in ('Right-arm pace', 'Left-arm pace', 'Right-arm spin', 'Left-arm spin', 'Do not bowl')),
  bowling_arm text not null check (bowling_arm in ('Right arm', 'Left arm', 'Not applicable')),
  cricket_experience text not null check (cricket_experience in ('New to cricket', 'Casual player', 'Club / college player', 'Experienced league player')),
  jersey_size text not null check (jersey_size in ('S', 'M', 'L', 'XL', 'XXL')),
  availability text not null check (availability in ('Available for all matches', 'Available for most matches', 'Need schedule confirmation')),
  created_at timestamptz not null default now()
);

alter table public.registrations add column if not exists player_type text;
alter table public.registrations add column if not exists batting_style text;
alter table public.registrations add column if not exists bowling_style text;
alter table public.registrations add column if not exists bowling_arm text;
alter table public.registrations add column if not exists cricket_experience text;
alter table public.registrations add column if not exists jersey_size text;
alter table public.registrations add column if not exists availability text;

alter table public.registrations enable row level security;

drop policy if exists "Anyone can submit registration" on public.registrations;
create policy "Anyone can submit registration"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

create index if not exists registrations_created_at_idx on public.registrations (created_at desc);
