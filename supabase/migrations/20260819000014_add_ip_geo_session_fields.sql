alter table public.sessions
  add column if not exists ip_hash text,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists isp text,
  add column if not exists visitor_id text,
  add column if not exists visit_number integer;

create index if not exists sessions_visitor_idx on public.sessions (visitor_id);

create table if not exists public.ip_geo (
  ip_hash text primary key,
  country text,
  region text,
  city text,
  isp text,
  updated_at timestamptz not null default now()
);

alter table public.ip_geo enable row level security;

drop policy if exists "anyone can read ip geo" on public.ip_geo;
create policy "anyone can read ip geo"
  on public.ip_geo for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can write ip geo" on public.ip_geo;
create policy "anyone can write ip geo"
  on public.ip_geo for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone can update ip geo" on public.ip_geo;
create policy "anyone can update ip geo"
  on public.ip_geo for update
  to anon, authenticated
  using (true)
  with check (true);