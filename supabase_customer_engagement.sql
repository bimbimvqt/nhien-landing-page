-- Customer engagement features for Nhiên CàFe.
-- Run this after the existing product/promotions migrations.

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS max_redemptions_per_user INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_total_redemptions INTEGER;

CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS user_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, task_key)
);

CREATE TABLE IF NOT EXISTS tasks (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS promotion_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  code_snapshot TEXT NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  redeemed_count INTEGER NOT NULL DEFAULT 0 CHECK (redeemed_count >= 0),
  remaining_uses INTEGER NOT NULL DEFAULT 1 CHECK (remaining_uses >= 0),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeem_note TEXT,
  UNIQUE (user_id, promotion_id)
);

ALTER TABLE promotion_claims
ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS redeem_note TEXT,
ADD COLUMN IF NOT EXISTS redeemed_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_uses INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS loyalty_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  stamps INTEGER NOT NULL DEFAULT 0 CHECK (stamps >= 0),
  tier TEXT NOT NULL DEFAULT 'Member',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  stamps INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION increment_promotion_usage(promotion_id_input UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE promotions
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = promotion_id_input;
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

INSERT INTO tasks (key, title, description, reward, sort_order) VALUES
  ('save_3_favorites', 'Lưu 3 món yêu thích', 'Bấm trái tim ở các món muốn thử.', 'Mở khóa mã ưu đãi', 10),
  ('follow_social', 'Theo dõi Nhiên CàFe', 'Theo dõi Facebook hoặc Instagram rồi xác nhận.', 'Tăng cơ hội nhận mã', 20),
  ('share_shop', 'Chia sẻ link quán', 'Gửi link Nhiên CàFe cho bạn bè.', 'Hoàn thành nhiệm vụ chia sẻ', 30),
  ('complete_profile', 'Hoàn thiện hồ sơ', 'Đăng nhập bằng tài khoản có tên và email.', 'Sẵn sàng tích điểm', 40),
  ('qr_checkin', 'Check-in tại quán bằng QR', 'Quét QR tại quầy khi ghé quán.', 'Nhận stamp tại quán', 50)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  reward = EXCLUDED.reward,
  sort_order = EXCLUDED.sort_order;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated cashier read profiles" ON profiles;
CREATE POLICY "Authenticated cashier read profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated cashier update profiles" ON profiles;
CREATE POLICY "Authenticated cashier update profiles" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can read own favorites" ON favorites;
CREATE POLICY "Users can read own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add own favorites" ON favorites;
CREATE POLICY "Users can add own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own favorites" ON favorites;
CREATE POLICY "Users can remove own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read access for tasks" ON tasks;
CREATE POLICY "Public read access for tasks" ON tasks
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Auth write access for tasks" ON tasks;
CREATE POLICY "Auth write access for tasks" ON tasks
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can read own task completions" ON user_task_completions;
CREATE POLICY "Users can read own task completions" ON user_task_completions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can complete own tasks" ON user_task_completions;
CREATE POLICY "Users can complete own tasks" ON user_task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own task completions" ON user_task_completions;
CREATE POLICY "Users can update own task completions" ON user_task_completions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own promotion claims" ON promotion_claims;
CREATE POLICY "Users can read own promotion claims" ON promotion_claims
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated cashier read promotion claims" ON promotion_claims;
CREATE POLICY "Authenticated cashier read promotion claims" ON promotion_claims
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can claim own promotions" ON promotion_claims;
CREATE POLICY "Users can claim own promotions" ON promotion_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own promotion claims" ON promotion_claims;
CREATE POLICY "Users can update own promotion claims" ON promotion_claims
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated cashier redeem promotion claims" ON promotion_claims;
CREATE POLICY "Authenticated cashier redeem promotion claims" ON promotion_claims
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can read own loyalty account" ON loyalty_accounts;
CREATE POLICY "Users can read own loyalty account" ON loyalty_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated cashier read loyalty accounts" ON loyalty_accounts;
CREATE POLICY "Authenticated cashier read loyalty accounts" ON loyalty_accounts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create own loyalty account" ON loyalty_accounts;
CREATE POLICY "Users can create own loyalty account" ON loyalty_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated cashier manage loyalty accounts" ON loyalty_accounts;
CREATE POLICY "Authenticated cashier manage loyalty accounts" ON loyalty_accounts
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can read own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can read own loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated cashier read loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Authenticated cashier read loyalty transactions" ON loyalty_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated cashier create loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Authenticated cashier create loyalty transactions" ON loyalty_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_product_id_idx ON favorites(product_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON profiles(phone);
CREATE INDEX IF NOT EXISTS tasks_active_sort_idx ON tasks(active, sort_order);
CREATE INDEX IF NOT EXISTS promotion_claims_user_id_idx ON promotion_claims(user_id);
CREATE INDEX IF NOT EXISTS promotion_claims_promotion_id_idx ON promotion_claims(promotion_id);
CREATE INDEX IF NOT EXISTS promotion_claims_redeemed_at_idx ON promotion_claims(redeemed_at);
CREATE INDEX IF NOT EXISTS user_task_completions_user_id_idx ON user_task_completions(user_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_user_id_idx ON loyalty_transactions(user_id);
