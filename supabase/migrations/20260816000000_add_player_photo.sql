alter table public.registrations
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read player photos" on storage.objects;
create policy "Public read player photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'player-photos');

drop policy if exists "Anyone can upload player photos" on storage.objects;
create policy "Anyone can upload player photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'player-photos');