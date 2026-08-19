-- public players page + player edit request workflow.
-- players_list: anon-readable full profile list for the /players page.
-- player_edit_requests: public users propose edits here; they NEVER touch registrations
-- directly. Admins approve (apply) or reject from the admin WORKFLOW tab.

create or replace function public.players_list()
returns table (
  id uuid, name text, photo_url text, player_type text, gender text,
  location text, batting_style text, bowling_style text, bowling_arm text,
  availability text, self_rating integer, dpl_played boolean, jersey_size text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.name, r.photo_url, r.player_type, r.gender, r.location,
         r.batting_style, r.bowling_style, r.bowling_arm, r.availability,
         r.self_rating, r.dpl_played, r.jersey_size, r.created_at
  from public.registrations r
  order by r.created_at asc;
$$;

revoke all on function public.players_list() from public;
grant execute on function public.players_list() to anon, authenticated;

create table if not exists public.player_edit_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.registrations(id) on delete cascade,
  player_name text not null,
  changes jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists player_edit_requests_status_idx
  on public.player_edit_requests (status, created_at desc);

alter table public.player_edit_requests enable row level security;

drop policy if exists "Anyone can propose an edit" on public.player_edit_requests;
create policy "Anyone can propose an edit"
  on public.player_edit_requests for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Admins can review edit requests" on public.player_edit_requests;
create policy "Admins can review edit requests"
  on public.player_edit_requests
  using (public.is_admin());