alter table store_settings
add column if not exists about_image_url text,
add column if not exists about_title text,
add column if not exists about_description_1 text,
add column if not exists about_description_2 text,
add column if not exists about_stats jsonb;
