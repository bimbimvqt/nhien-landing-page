import { connection } from 'next/server';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import BestSeller from '@/components/landing/BestSeller';
import Menu from '@/components/landing/Menu';
import Gallery from '@/components/landing/Gallery';
import Footer from '@/components/landing/Footer';
import FloatingActions from '@/components/landing/FloatingActions';
import Promotions from '@/components/landing/Promotions';
import { supabase } from '@/lib/supabaseClient';
import { normalizeStoreSettings } from '@/lib/storeSettings';

async function getStoreSettings() {
  await connection();

  const { data, error } = await supabase
    .from('store_settings')
    .select('brand_name, hotline, address, facebook_url, instagram_url, map_embed_url, hero_image_url, opening_hours, updated_at')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching store settings:', error);
  }

  return normalizeStoreSettings(data);
}

export default async function LandingPage() {
  const storeSettings = await getStoreSettings();

  return (
    <main className="landing-theme min-h-screen">
      <Navbar />
      <Hero backgroundImageUrl={storeSettings.hero_image_url || ''} />
      <About />
      <BestSeller />
      <Menu />
      <Promotions settings={storeSettings} />
      <Gallery />
      <Footer settings={storeSettings} />
      <FloatingActions settings={storeSettings} />
    </main>
  );
}
