-- Teams live: full team details + player-to-team mapping.
-- Rebuilds the placeholder 'teams' table into the real 10 DPL teams,
-- adds a team_players join table mapping registered players to teams,
-- and provides teams_list / team_roster RPCs for the app.

-- 1. Extend teams with the fields the app shows.
alter table public.teams
  add column if not exists code text,
  add column if not exists icon_url text not null default '',
  add column if not exists theme text not null default '',
  add column if not exists owner text,
  add column if not exists captain text,
  add column if not exists champion boolean not null default false;

alter table public.teams
  add constraint teams_code_unique unique (code);

-- 2. Replace placeholder teams with the real 10 DPL teams.
truncate table public.teams;

insert into public.teams (name, code, icon_url, theme, owner, captain, champion, sort_order) values
  ('Digi Super Kings',    'DSK', '/D2P/teams/dsk.png',          'kings',       'TBD', 'TBD', false, 1),
  ('Sahyadriche Mavale',  'SM',  '/D2P/teams/mavale.png',       'mavale',      'TBD', 'TBD', false, 2),
  ('Digi Mitra Mandal',   'DMM', '/D2P/teams/mitra.png',        'mitra',       'TBD', 'TBD', false, 3),
  ('Bhakarwadi Blasters', 'BB',  '/D2P/teams/blaster.png',      'blaster',     'TBD', 'TBD', false, 4),
  ('Digi Dhadakebaaz',    'DD',  '/D2P/teams/dhada.png',        'dhada',       'TBD', 'TBD', false, 5),
  ('Cricket Wala',        'CW',  '/D2P/teams/wala.png',         'wala',        'TBD', 'TBD', false, 6),
  ('Digi Titans',         'DT',  '/D2P/teams/titans.png',       'titans',      'TBD', 'TBD', false, 7),
  ('Digi Yodhas',         'DY',  '/D2P/teams/yodhas.png',       'yodhas',      'TBD', 'TBD', false, 8),
  ('Gallit Maramari',     'GM',  '/D2P/teams/gallit.png',       'gallit',      'TBD', 'TBD', true,  9),
  ('Digi Dhurandhars',    'DDH', '/D2P/teams/dhurandhars.png',  'dhurandhars', 'TBD', 'TBD', false, 10);

-- 3. Player-to-team mapping.
create table if not exists public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.registrations(id) on delete cascade,
  role text not null default 'player' check (role in ('captain', 'vice_captain', 'player')),
  created_at timestamptz not null default now(),
  unique (team_id, player_id)
);

create index if not exists team_players_team_idx on public.team_players (team_id);
create index if not exists team_players_player_idx on public.team_players (player_id);

alter table public.team_players enable row level security;

drop policy if exists "Anyone can read team_players" on public.team_players;
create policy "Anyone can read team_players"
  on public.team_players for select
  to anon, authenticated using (true);

-- 4. RPCs
-- teams_list: all teams with computed live player count.
create or replace function public.teams_list()
returns table (
  id uuid,
  name text,
  code text,
  icon_url text,
  theme text,
  owner text,
  captain text,
  champion boolean,
  player_count bigint,
  sort_order integer
)
language sql
security definer
set search_path = public
as $$
  select
    t.id, t.name, t.code, t.icon_url, t.theme, t.owner, t.captain, t.champion,
    (select count(*) from public.team_players tp where tp.team_id = t.id) as player_count,
    t.sort_order
  from public.teams t
  order by t.sort_order;
$$;

revoke all on function public.teams_list() from public;
grant execute on function public.teams_list() to anon, authenticated;

-- team_roster: players mapped to a team by code.
create or replace function public.team_roster(team_code text)
returns table (
  id uuid,
  name text,
  photo_url text,
  player_type text,
  location text,
  dpl_played boolean,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    r.id, r.name, r.photo_url, r.player_type, r.location, r.dpl_played, tp.role
  from public.team_players tp
  join public.registrations r on r.id = tp.player_id
  join public.teams t on t.id = tp.team_id
  where t.code = team_code
  order by case tp.role when 'captain' then 0 when 'vice_captain' then 1 else 2 end, r.created_at;
$$;

revoke all on function public.team_roster(text) from public;
grant execute on function public.team_roster(text) to anon, authenticated;