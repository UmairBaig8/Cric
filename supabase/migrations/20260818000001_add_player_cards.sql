create or replace function public.player_cards(limit_count integer default 8)
returns table (id uuid, name text, photo_url text, player_type text, squad text, jersey_size text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select r.id, r.name, r.photo_url, r.player_type, r.squad, r.jersey_size, r.created_at
  from public.registrations r
  order by r.created_at desc
  limit limit_count;
$$;

revoke all on function public.player_cards(integer) from public;
grant execute on function public.player_cards(integer) to anon, authenticated;