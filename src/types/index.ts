export type Category = 'Cà phê' | 'Cold brew' | 'Signature' | 'Matcha' | 'Cacao' | 'Trà' | 'Món khác';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price_s: number | null;
  price_m: number | null;
  category: Category;
  sub_category: string | null;
  image_url: string | null;
  is_best_seller: boolean;
  created_at: string;
}


export interface Promotion {
  id: string;
  name: string;
  code: string;
  discount: string;
  usage_count: number;
  max_redemptions_per_user: number;
  max_total_redemptions: number | null;
  end_date: string | null;
  active: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTaskCompletion {
  id: string;
  user_id: string;
  task_key: string;
  completed_at: string;
}

export interface PromotionClaim {
  id: string;
  user_id: string;
  promotion_id: string;
  code_snapshot: string;
  claimed_at: string;
  redeemed_count: number;
  remaining_uses: number;
  redeemed_at: string | null;
  redeemed_by: string | null;
  redeem_note: string | null;
  promotion?: Promotion;
}

export interface LoyaltyAccount {
  user_id: string;
  points: number;
  stamps: number;
  tier: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  points: number;
  stamps: number;
  note: string | null;
  created_at: string;
}

export interface OpeningHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface StoreSettings {
  id: number;
  brand_name: string;
  hotline: string;
  address: string;
  facebook_url: string | null;
  instagram_url: string | null;
  map_embed_url: string | null;
  hero_image_url: string | null;
  opening_hours: OpeningHour[];
  updated_at: string;
}
