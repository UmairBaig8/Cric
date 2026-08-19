-- players_list: add email column for the edit dialog's Work email field.

drop function if exists public.players_list();

create or replace function public.players_list()
returns table (
  id uuid, name text, photo_url text, player_type text, gender text,
  location text, batting_style text, bowling_style text, bowling_arm text,
  availability text, self_rating integer, dpl_played boolean, jersey_size text,
  email text, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.name, r.photo_url, r.player_type, r.gender, r.location,
         r.batting_style, r.bowling_style, r.bowling_arm, r.availability,
         r.self_rating, r.dpl_played, r.jersey_size, r.email, r.created_at
  from public.registrations r
  order by r.created_at asc;
$$;

revoke all on function public.players_list() from public;
grant execute on function public.players_list() to anon, authenticated;