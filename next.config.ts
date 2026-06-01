import type { NextConfig } from "next";

function getSupabaseHostname() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return undefined;
  }

  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return undefined;
  }
}

const supabaseHostname = getSupabaseHostname();
const backendUrl =
  process.env.API_INTERNAL_URL ||
  (process.env.NODE_ENV === 'production' ? 'http://api:8080' : 'http://localhost:8080');

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/products',
        destination: `${backendUrl}/api/products`,
      },
      {
        source: '/api/promotions',
        destination: `${backendUrl}/api/promotions`,
      },
      {
        source: '/api/store-settings',
        destination: `${backendUrl}/api/store-settings`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.skytruong.com',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
            },
          ]
        : []),
    ],
  },
  allowedDevOrigins: ['192.168.110.56'],
};

export default nextConfig;
