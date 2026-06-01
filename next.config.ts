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

const nextConfig: NextConfig = {
  output: 'standalone',
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
