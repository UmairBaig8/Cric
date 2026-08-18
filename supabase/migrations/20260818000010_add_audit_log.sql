-- audit log: track admin actions for the tournament committee.
-- Writes are fire-and-forget from the client; no deletes are ever issued against registrations.
create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  actor_email text not null,
  action text not null,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit enable row level security;

drop policy if exists "Admins can read audit log" on public.admin_audit;
create policy "Admins can read audit log"
  on public.admin_audit for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can write audit log" on public.admin_audit;
create policy "Admins can write audit log"
  on public.admin_audit for insert
  to authenticated
  with check (public.is_admin());

grant select, insert on public.admin_audit to authenticated;