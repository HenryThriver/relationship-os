import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/ssr'],
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ensure webpack can resolve the @ alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
