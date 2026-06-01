-- Create tables for banners, promotions, and store settings

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  discount TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  max_redemptions_per_user INTEGER NOT NULL DEFAULT 1 CHECK (max_redemptions_per_user > 0),
  max_total_redemptions INTEGER CHECK (max_total_redemptions IS NULL OR max_total_redemptions > 0),
  end_date TEXT, -- Storing as text to match existing UI format or could use TIMESTAMP
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS max_redemptions_per_user INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_total_redemptions INTEGER;

-- Store Settings table (single row for all settings)
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  brand_name TEXT DEFAULT 'Nhiên CàFe',
  hotline TEXT DEFAULT '0357 258 159',
  address TEXT DEFAULT '8 Lam Sơn, Lộc Sơn, Bảo Lộc',
  facebook_url TEXT DEFAULT 'https://www.facebook.com/nhiencafes',
  instagram_url TEXT,
  map_embed_url TEXT DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3921.282583803874!2d107.8105!3d11.5434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDMyJzM2LjIiTiAxMDfCsDQ4JzM3LjgiRQ!5e0!3m2!1svi!2svn!4v1700000000000',
  hero_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop',
  opening_hours JSONB DEFAULT '[
    {"day": "Thứ Hai", "open": "07:00", "close": "22:00", "closed": false},
    {"day": "Thứ Ba", "open": "07:00", "close": "22:00", "closed": false},
    {"day": "Thứ Tư", "open": "07:00", "close": "22:00", "closed": false},
    {"day": "Thứ Năm", "open": "07:00", "close": "22:00", "closed": false},
    {"day": "Thứ Sáu", "open": "07:00", "close": "23:00", "closed": false},
    {"day": "Thứ Bảy", "open": "07:00", "close": "23:00", "closed": false},
    {"day": "Chủ Nhật", "open": "07:00", "close": "22:00", "closed": false}
  ]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial settings
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop';

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS map_embed_url TEXT DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3921.282583803874!2d107.8105!3d11.5434!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDMyJzM2LjIiTiAxMDfCsDQ4JzM3LjgiRQ!5e0!3m2!1svi!2svn!4v1700000000000';

-- RLS Policies (Assuming you want public read access and authenticated write access)

-- Banners
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for banners" ON banners;
CREATE POLICY "Public read access for banners" ON banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth write access for banners" ON banners;
CREATE POLICY "Auth write access for banners" ON banners FOR ALL USING (auth.role() = 'authenticated');

-- Promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for promotions" ON promotions;
CREATE POLICY "Public read access for promotions" ON promotions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth write access for promotions" ON promotions;
CREATE POLICY "Auth write access for promotions" ON promotions FOR ALL USING (auth.role() = 'authenticated');

-- Store Settings
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for store_settings" ON store_settings;
CREATE POLICY "Public read access for store_settings" ON store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth write access for store_settings" ON store_settings;
CREATE POLICY "Auth write access for store_settings" ON store_settings FOR ALL USING (auth.role() = 'authenticated');
