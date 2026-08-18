-- admin full-edit: expose cricketing profile fields on admin_players
-- so the admin (central authority) can edit every registration column.
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
  batting_style text,
  bowling_style text,
  bowling_arm text,
  availability text,
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
    r.bowling_arm, r.availability, r.created_at,
    tp.team_id, t.code as team_code, tp.role
  from public.registrations r
  left join public.team_players tp on tp.player_id = r.id
  left join public.teams t on t.id = tp.team_id
  where public.is_admin()
  order by r.created_at desc;
$$;

revoke all on function public.admin_players() from public;
grant execute on function public.admin_players() to authenticated;