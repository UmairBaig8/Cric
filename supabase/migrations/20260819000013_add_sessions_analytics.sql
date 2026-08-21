alter table public.page_views
  add column if not exists device text,
  add column if not exists browser text,
  add column if not exists os text,
  add column if not exists referrer text;

create table if not exists public.sessions (
  id text primary key,
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  page_count integer not null default 1,
  device text,
  browser text,
  os text,
  referrer text,
  is_active boolean not null default true
);

create index if not exists sessions_last_seen_idx on public.sessions (last_seen desc);
create index if not exists sessions_started_at_idx on public.sessions (started_at);

alter table public.sessions enable row level security;

drop policy if exists "anyone can create session" on public.sessions;
create policy "anyone can create session"
  on public.sessions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone can update session" on public.sessions;
create policy "anyone can update session"
  on public.sessions for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "admins can read sessions" on public.sessions;
create policy "anyone can read sessions"
  on public.sessions for select
  to anon, authenticated
  using (true);

drop function if exists public.admin_views_summary();

create or replace function public.admin_views_summary()
returns table (today bigint, total bigint, paths jsonb, active_sessions bigint, sessions_today bigint, recent_sessions jsonb, top_cities jsonb, referrers jsonb, hours jsonb, heatmap jsonb, registered_visitors bigint)
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
    ), '[]'::jsonb) as paths,
    (select count(*)::bigint from public.sessions where is_active and last_seen >= now() - interval '2 minutes') as active_sessions,
    (select count(*)::bigint from public.sessions where started_at >= date_trunc('day', now())) as sessions_today,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'started_at', s.started_at,
        'last_seen', s.last_seen,
        'page_count', s.page_count,
        'device', s.device,
        'browser', s.browser,
        'os', s.os,
        'language', s.language,
        'screen', s.screen,
        'referrer', s.referrer,
        'is_active', s.is_active,
        'country', s.country,
        'region', s.region,
        'city', s.city,
        'isp', s.isp,
        'visit_number', s.visit_number,
        'pages', coalesce((
          select jsonb_agg(pv.path order by pv.viewed_at)
          from public.page_views pv
          where pv.session_id = s.id
        ), '[]'::jsonb)
      ) order by s.last_seen desc)
      from (select * from public.sessions order by last_seen desc limit 12) s
    ), '[]'::jsonb) as recent_sessions,
    coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'sessions', cnt) order by cnt desc)
      from (
        select case
          when city is not null and country is not null then city || ', ' || country
          when city is not null then city
          when country is not null then country
          else 'Unknown'
        end as label, count(*)::int as cnt
        from public.sessions
        where started_at >= date_trunc('day', now())
        group by 1
      ) t
    ), '[]'::jsonb) as top_cities,
    coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'sessions', cnt) order by cnt desc)
      from (
        select coalesce(referrer, 'direct') as label, count(*)::int as cnt
        from public.sessions
        where started_at >= date_trunc('day', now())
        group by 1
      ) t
    ), '[]'::jsonb) as referrers,
    coalesce((
      select jsonb_agg(jsonb_build_object('hour', h, 'views', cnt) order by h)
      from (
        select extract(epoch from date_trunc('hour', viewed_at))::bigint as h, count(*)::int as cnt
        from public.page_views
        where viewed_at >= now() - interval '24 hours'
        group by 1
      ) t
    ), '[]'::jsonb) as hours,
    coalesce((
      select jsonb_agg(jsonb_build_object('dow', dow, 'hour', hour, 'views', cnt))
      from (
        select extract(dow from viewed_at)::int as dow, extract(hour from viewed_at)::int as hour, count(*)::int as cnt
        from public.page_views
        where viewed_at >= now() - interval '7 days'
        group by 1, 2
      ) t
    ), '[]'::jsonb) as heatmap,
    (select count(*)::bigint from public.registrations where visitor_id is not null) as registered_visitors
  where public.is_admin()
$$;