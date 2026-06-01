create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_s numeric,
  price_m numeric,
  category text not null,
  sub_category text,
  image_url text,
  is_best_seller boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  discount text not null,
  usage_count integer not null default 0,
  max_redemptions_per_user integer not null default 1 check (max_redemptions_per_user > 0),
  max_total_redemptions integer check (max_total_redemptions is null or max_total_redemptions > 0),
  end_date text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists store_settings (
  id integer primary key default 1,
  brand_name text not null default 'Nhiên CàFe',
  hotline text not null default '0357 258 159',
  address text not null default '8 Lam Sơn, Lộc Sơn, Bảo Lộc',
  facebook_url text default 'https://www.facebook.com/nhiencafes',
  instagram_url text,
  map_embed_url text default 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3921.282583803874!2d107.8105!3d11.5434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDMyJzM2LjIiTiAxMDfCsDQ4JzM3LjgiRQ!5e0!3m2!1svi!2svn!4v1700000000000',
  hero_image_url text default 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop',
  opening_hours jsonb not null default '[
    {"day": "Thứ Hai", "open": "07:00", "close": "22:00", "closed": false},
    {"day": "Thứ Ba", "open": "07:00", "close": "22:00", "closed": false},
    {"day": "Thứ Tư", "open": "07:00", "close": "22:00", "closed": false},
    {"day": "Thứ Năm", "open": "07:00", "close": "22:00", "closed": false},
    {"day": "Thứ Sáu", "open": "07:00", "close": "23:00", "closed": false},
    {"day": "Thứ Bảy", "open": "07:00", "close": "23:00", "closed": false},
    {"day": "Chủ Nhật", "open": "07:00", "close": "22:00", "closed": false}
  ]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint single_store_settings_row check (id = 1)
);

insert into store_settings (id) values (1)
on conflict (id) do nothing;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  avatar_url text,
  provider text,
  provider_subject text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  display_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists tasks (
  key text primary key,
  title text not null,
  description text,
  reward text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists user_task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  task_key text not null references tasks(key) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, task_key)
);

create table if not exists promotion_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  promotion_id uuid not null references promotions(id) on delete cascade,
  code_snapshot text not null,
  claimed_at timestamptz not null default now(),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  remaining_uses integer not null default 1 check (remaining_uses >= 0),
  redeemed_at timestamptz,
  redeemed_by uuid references users(id) on delete set null,
  redeem_note text,
  unique (user_id, promotion_id)
);

create table if not exists loyalty_accounts (
  user_id uuid primary key references users(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  stamps integer not null default 0 check (stamps >= 0),
  tier text not null default 'Member',
  updated_at timestamptz not null default now()
);

create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  points integer not null,
  stamps integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);

insert into tasks (key, title, description, reward, sort_order) values
  ('save_3_favorites', 'Lưu 3 món yêu thích', 'Bấm trái tim ở các món muốn thử.', 'Mở khóa mã ưu đãi', 10),
  ('follow_social', 'Theo dõi Nhiên CàFe', 'Theo dõi Facebook hoặc Instagram rồi xác nhận.', 'Tăng cơ hội nhận mã', 20),
  ('share_shop', 'Chia sẻ link quán', 'Gửi link Nhiên CàFe cho bạn bè.', 'Hoàn thành nhiệm vụ chia sẻ', 30),
  ('complete_profile', 'Hoàn thiện hồ sơ', 'Đăng nhập bằng tài khoản có tên và email.', 'Sẵn sàng tích điểm', 40),
  ('qr_checkin', 'Check-in tại quán bằng QR', 'Quét QR tại quầy khi ghé quán.', 'Nhận stamp tại quán', 50)
on conflict (key) do update set
  title = excluded.title,
  description = excluded.description,
  reward = excluded.reward,
  sort_order = excluded.sort_order;

create index if not exists products_category_idx on products(category);
create index if not exists products_best_seller_idx on products(is_best_seller);
create index if not exists promotions_active_idx on promotions(active, created_at desc);
create index if not exists favorites_user_id_idx on favorites(user_id);
create index if not exists favorites_product_id_idx on favorites(product_id);
create index if not exists profiles_email_idx on profiles(email);
create index if not exists profiles_phone_idx on profiles(phone);
create index if not exists tasks_active_sort_idx on tasks(active, sort_order);
create index if not exists promotion_claims_user_id_idx on promotion_claims(user_id);
create index if not exists promotion_claims_promotion_id_idx on promotion_claims(promotion_id);
create index if not exists promotion_claims_redeemed_at_idx on promotion_claims(redeemed_at);
create index if not exists user_task_completions_user_id_idx on user_task_completions(user_id);
create index if not exists loyalty_transactions_user_id_idx on loyalty_transactions(user_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_settings_set_updated_at on store_settings;
create trigger store_settings_set_updated_at
before update on store_settings
for each row execute function set_updated_at();

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
before update on profiles
for each row execute function set_updated_at();
