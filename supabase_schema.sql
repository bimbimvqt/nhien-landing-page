-- Create a table for products
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price_s numeric,
  price_m numeric,
  category text not null,
  sub_category text,
  image_url text,
  is_best_seller boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table products enable row level security;

-- Create policy to allow public to read products
create policy "Allow public read" on products for select using (true);

-- Create policy to allow authenticated users to manage products
create policy "Allow auth admin" on products for all using (auth.role() = 'authenticated');

-- Storage Bucket for product images
-- Note: Run this in Supabase SQL Editor if you want to create the bucket via SQL
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
-- create policy "Public Access" on storage.objects for select using ( bucket_id = 'product-images' );
-- create policy "Admin Manage" on storage.objects for all using ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
