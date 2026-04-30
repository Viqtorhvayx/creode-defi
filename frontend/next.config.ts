// Build: 2026-04-30T17:21 — Cache bust for Vercel CDN
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@reown/appkit",
    "@reown/appkit-adapter-wagmi",
    "wagmi",
    "@wagmi/core",
    "@wagmi/connectors"
  ],
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  turbopack: {}
};

export default nextConfig;
