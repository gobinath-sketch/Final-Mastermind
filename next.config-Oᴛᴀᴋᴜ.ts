import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/stocks',
        destination: '/dashboard/market',
        permanent: true,
      },
      {
        source: '/dashboard/chat',
        destination: '/dashboard/ai-chat',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
