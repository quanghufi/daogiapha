import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent caching of API/auth error responses that cause stale "No API key" 304s
  headers: async () => [
    {
      // All dynamic pages — no CDN/browser caching
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        { key: 'X-Accel-Expires', value: '0' },
      ],
    },
  ],
};

export default nextConfig;
