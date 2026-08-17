-- Add player self-rating (1-5 stars) to registrations and expose in auction/admin RPCs.

alter table public.registrations
  add column if not exists self_rating integer not null default 3 check (self_rating between 1 and 5);

-- auction_players: include self_rating.
drop function if exists public.auction_players();
create or replace function public.auction_players()
returns table (
  id uuid,
  name text,
  employee_id text,
  photo_url text,
  player_type text,
  gender text,
  location text,
  dpl_played boolean,
  self_rating integer,
  availability text,
  batting_style text,
  bowling_style text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    r.id, r.name, r.employee_id, r.photo_url, r.player_type, r.gender, r.location,
    r.dpl_played, r.self_rating, r.availability, r.batting_style, r.bowling_style, r.created_at
  from public.registrations r
  order by r.created_at desc;
$$;

revoke all on function public.auction_players() from public;
grant execute on function public.auction_players() to anon, authenticated;

-- admin_players: include self_rating for editing.
drop function if exists public.admin_players();
create or replace function public.admin_players()
returns table (
  id uuid,
  name text,
  email text,
  employee_id text,
  photo_url text,
  player_type text,
  gender text,
  location text,
  dpl_played boolean,
  self_rating integer,
  created_at timestamptz,
  team_id uuid,
  team_code text,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    r.id, r.name, r.email, r.employee_id, r.photo_url, r.player_type, r.gender,
    r.location, r.dpl_played, r.self_rating, r.created_at,
    tp.team_id, t.code as team_code, tp.role
  from public.registrations r
  left join public.team_players tp on tp.player_id = r.id
  left join public.teams t on t.id = tp.team_id
  where public.is_admin()
  order by r.created_at desc;
$$;

revoke all on function public.admin_players() from public;
grant execute on function public.admin_players() to authenticated;
