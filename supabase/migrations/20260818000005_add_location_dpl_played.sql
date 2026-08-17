-- Form redesign: remove squad + jersey from the UI, replace experience
-- with "DPL played or not", add location (CZ / SP / Other).
-- Old columns are kept but made optional so existing rows/views keep working.

alter table public.registrations
  add column if not exists location text,
  add column if not exists dpl_played boolean default false;

-- Relax the columns no longer collected from the form.
alter table public.registrations
  drop constraint if exists registrations_cricket_experience_check,
  drop constraint if exists registrations_jersey_size_check;

alter table public.registrations
  alter column cricket_experience drop not null,
  alter column jersey_size drop not null,
  alter column squad drop not null;

-- Backfill + guard the new location field.
update public.registrations
  set location = 'Other'
  where location is null;

alter table public.registrations
  add constraint registrations_location_check check (location in ('CZ', 'SP', 'Other'));

alter table public.registrations
  alter column location set not null;

-- player_cards: show location instead of squad / jersey.
create or replace function public.player_cards(limit_count integer default 8)
returns table (id uuid, name text, photo_url text, player_type text, location text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select r.id, r.name, r.photo_url, r.player_type, r.location, r.created_at
  from public.registrations r
  order by r.created_at desc
  limit limit_count;
$$;

revoke all on function public.player_cards(integer) from public;
grant execute on function public.player_cards(integer) to anon, authenticated;

-- auction_players: show location + DPL status instead of squad / jersey / experience.
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
    r.dpl_played, r.availability, r.batting_style, r.bowling_style, r.created_at
  from public.registrations r
  order by r.created_at desc;
$$;

revoke all on function public.auction_players() from public;
grant execute on function public.auction_players() to anon, authenticated;