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
  }
};

export default nextConfig;
