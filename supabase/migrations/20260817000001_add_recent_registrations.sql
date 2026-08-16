create or replace function public.recent_registrations(limit_count integer default 5)
returns table (id uuid, name text, photo_url text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select r.id, r.name, r.photo_url, r.created_at
  from public.registrations r
  where r.photo_url is not null
  order by r.created_at desc
  limit limit_count;
$$;

revoke all on function public.recent_registrations(integer) from public;
grant execute on function public.recent_registrations(integer) to anon, authenticated;