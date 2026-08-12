create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 254),
  department text not null check (char_length(department) between 2 and 120),
  created_at timestamptz not null default now()
);

alter table public.registrations enable row level security;

create policy "Anyone can submit registration"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

create index if not exists registrations_created_at_idx on public.registrations (created_at desc);
