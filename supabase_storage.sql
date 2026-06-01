-- Storage bucket for product menu images.
-- Run this once in Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Authenticated upload product images" on storage.objects;
drop policy if exists "Authenticated update product images" on storage.objects;
drop policy if exists "Authenticated delete product images" on storage.objects;

create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Authenticated upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

create policy "Authenticated update product images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);

create policy "Authenticated delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and auth.role() = 'authenticated'
);
