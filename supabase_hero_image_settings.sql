ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop';

UPDATE store_settings
SET hero_image_url = COALESCE(
  hero_image_url,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop'
)
WHERE id = 1;
