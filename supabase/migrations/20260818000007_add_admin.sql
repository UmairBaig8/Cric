-- Admin panel: whitelisted emails + RLS write access for admins.
-- Auth uses Supabase Auth (email/password); a user is an admin if their
-- confirmed email is present in public.admin_users.

-- 1. Admin whitelist.
create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.admin_users (email) values ('umairbaig808@gmail.com')
on conflict (email) do nothing;

alter table public.admin_users enable row level security;

drop policy if exists "Authenticated can read admin_users" on public.admin_users;
create policy "Authenticated can read admin_users"
  on public.admin_users for select
  to authenticated using (true);

-- 2. is_admin(): true when the signed-in user's email is whitelisted.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 3. Admin write access.
-- settings: admins may update the single settings row.
drop policy if exists "Admins can update settings" on public.settings;
create policy "Admins can update settings"
  on public.settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- teams: admins can insert / update / delete.
drop policy if exists "Admins can insert teams" on public.teams;
create policy "Admins can insert teams"
  on public.teams for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update teams" on public.teams;
create policy "Admins can update teams"
  on public.teams for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete teams" on public.teams;
create policy "Admins can delete teams"
  on public.teams for delete
  to authenticated
  using (public.is_admin());

-- team_players: admins can insert / update / delete (anyone can read).
drop policy if exists "Admins can insert team_players" on public.team_players;
create policy "Admins can insert team_players"
  on public.team_players for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update team_players" on public.team_players;
create policy "Admins can update team_players"
  on public.team_players for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete team_players" on public.team_players;
create policy "Admins can delete team_players"
  on public.team_players for delete
  to authenticated
  using (public.is_admin());

-- registrations: admins can read and update (to correct typos, set dpl_played, etc.).
drop policy if exists "Admins can read registrations" on public.registrations;
create policy "Admins can read registrations"
  on public.registrations for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update registrations" on public.registrations;
create policy "Admins can update registrations"
  on public.registrations for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Admin data RPCs.
-- admin_players: every registration with its team assignment + role.
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
    r.location, r.dpl_played, r.created_at,
    tp.team_id, t.code as team_code, tp.role
  from public.registrations r
  left join public.team_players tp on tp.player_id = r.id
  left join public.teams t on t.id = tp.team_id
  where public.is_admin()
  order by r.created_at desc;
$$;

revoke all on function public.admin_players() from public;
grant execute on function public.admin_players() to authenticated;

-- admin_teams: full team rows including icon_url / theme (write source for admin).
create or replace function public.admin_teams()
returns setof public.teams
language sql
security definer
set search_path = public
as $$
  select * from public.teams
  where public.is_admin()
  order by sort_order, name;
$$;

revoke all on function public.admin_teams() from public;
grant execute on function public.admin_teams() to authenticated;

-- extend admin_players with profile fields + jersey (supersedes earlier def)
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
  self_rating numeric,
  batting_style text,
  bowling_style text,
  bowling_arm text,
  availability text,
  jersey_size text,
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
    r.location, r.dpl_played, r.self_rating, r.batting_style, r.bowling_style,
    r.bowling_arm, r.availability, r.jersey_size, r.created_at,
    tp.team_id, t.code as team_code, tp.role
  from public.registrations r
  left join public.team_players tp on tp.player_id = r.id
  left join public.teams t on t.id = tp.team_id
  where public.is_admin()
$$;
