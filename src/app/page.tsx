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
import { fetchStoreSettings } from '@/lib/backendApi';
import { normalizeStoreSettings } from '@/lib/storeSettings';

async function getStoreSettings() {
  await connection();

  try {
    return normalizeStoreSettings(await fetchStoreSettings());
  } catch (error) {
    console.error('Error fetching store settings:', error);
  }

  return normalizeStoreSettings(null);
}

export default async function LandingPage() {
  const storeSettings = await getStoreSettings();

  return (
    <main className="landing-theme min-h-screen">
      <Navbar />
      <Hero backgroundImageUrl={storeSettings.hero_image_url || ''} />
      <About settings={storeSettings} />
      <BestSeller />
      <Menu />
      <Promotions settings={storeSettings} />
      <Gallery settings={storeSettings} />
      <Footer settings={storeSettings} />
      <FloatingActions settings={storeSettings} />
    </main>
  );
}
