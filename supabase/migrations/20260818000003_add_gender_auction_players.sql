alter table public.registrations
  add column if not exists gender text check (gender in ('Male', 'Female'));

update public.registrations
set gender = 'Male'
where gender is null;

alter table public.registrations
  alter column gender set not null;

create or replace function public.auction_players()
returns table (
  id uuid,
  name text,
  employee_id text,
  photo_url text,
  player_type text,
  squad text,
  gender text,
  jersey_size text,
  cricket_experience text,
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
    r.id, r.name, r.employee_id, r.photo_url, r.player_type, r.squad, r.gender,
    r.jersey_size, r.cricket_experience, r.availability, r.batting_style, r.bowling_style,
    r.created_at
  from public.registrations r
  order by r.created_at desc;
$$;

revoke all on function public.auction_players() from public;
grant execute on function public.auction_players() to anon, authenticated;