import fs from 'node:fs';
import process from 'node:process';

import { createClient } from '@supabase/supabase-js';

const envFile = process.argv.includes('--env-file')
  ? process.argv[process.argv.indexOf('--env-file') + 1]
  : '.env.local';

loadEnvFile(envFile);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiBaseUrl =
  process.env.MIGRATION_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8080';
const adminApiKey = process.env.ADMIN_API_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const headers = {
  'Content-Type': 'application/json',
};

if (adminApiKey) {
  headers['X-Admin-API-Key'] = adminApiKey;
}

await migrateStoreSettings();
await migrateProducts();
await migratePromotions();

function loadEnvFile(file) {
  if (!fs.existsSync(file)) {
    return;
  }

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function migrateStoreSettings() {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.warn(`Skip store_settings: ${error.message}`);
    return;
  }
  if (!data) {
    console.log('No store_settings row to migrate');
    return;
  }

  await apiRequest('/api/store-settings', 'PUT', {
    brand_name: data.brand_name,
    hotline: data.hotline,
    address: data.address,
    facebook_url: data.facebook_url,
    instagram_url: data.instagram_url,
    map_embed_url: data.map_embed_url,
    hero_image_url: data.hero_image_url,
    opening_hours: data.opening_hours,
  });
  console.log('Migrated store_settings');
}

async function migrateProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.warn(`Skip products: ${error.message}`);
    return;
  }

  const existingProducts = await apiRequest('/api/products?limit=500', 'GET');
  const existingKeys = new Set(
    existingProducts.map((product) => `${product.name.trim().toLowerCase()}::${product.category}`),
  );

  let migrated = 0;
  for (const product of data || []) {
    const key = `${product.name.trim().toLowerCase()}::${product.category}`;
    if (existingKeys.has(key)) {
      continue;
    }

    await apiRequest('/api/products', 'POST', {
      name: product.name,
      description: product.description,
      price_s: product.price_s === null ? null : Number(product.price_s),
      price_m: product.price_m === null ? null : Number(product.price_m),
      category: product.category,
      sub_category: product.sub_category,
      image_url: product.image_url,
      is_best_seller: Boolean(product.is_best_seller),
    });
    existingKeys.add(key);
    migrated += 1;
  }

  console.log(`Migrated ${migrated} products`);
}

async function migratePromotions() {
  const { data, error } = await supabase.from('promotions').select('*');
  if (error) {
    console.warn(`Skip promotions: ${error.message}`);
    return;
  }

  const existingPromotions = await apiRequest('/api/promotions?limit=500', 'GET');
  const existingCodes = new Set(
    existingPromotions.map((promotion) => promotion.code.trim().toLowerCase()),
  );

  let migrated = 0;
  for (const promotion of data || []) {
    const code = promotion.code.trim().toLowerCase();
    if (existingCodes.has(code)) {
      continue;
    }

    await apiRequest('/api/promotions', 'POST', {
      name: promotion.name,
      code: promotion.code,
      discount: promotion.discount,
      usage_count: promotion.usage_count || 0,
      max_redemptions_per_user: promotion.max_redemptions_per_user || 1,
      max_total_redemptions: promotion.max_total_redemptions,
      end_date: promotion.end_date,
      active: Boolean(promotion.active),
    });
    existingCodes.add(code);
    migrated += 1;
  }

  console.log(`Migrated ${migrated} promotions`);
}

async function apiRequest(path, method, body) {
  const init = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, init);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${path} failed with ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
