create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  session_id text not null,
  viewed_at timestamptz not null default now()
);

create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists page_views_viewed_at_idx on public.page_views (viewed_at);

alter table public.page_views enable row level security;

drop policy if exists "anyone can log page views" on public.page_views;
create policy "anyone can log page views"
  on public.page_views for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admins can read page views" on public.page_views;
create policy "admins can read page views"
  on public.page_views for select
  to anon, authenticated
  using (public.is_admin());

create or replace function public.admin_views_summary()
returns table (today bigint, total bigint, paths jsonb)
language sql
security definer
set search_path = 'public'
as $$
  select
    (select count(*)::bigint from public.page_views where viewed_at >= date_trunc('day', now())) as today,
    (select count(*)::bigint from public.page_views) as total,
    coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'views', cnt) order by cnt desc)
      from (select path, count(*) as cnt from public.page_views group by path) t
    ), '[]'::jsonb) as paths
  where public.is_admin()
$$;