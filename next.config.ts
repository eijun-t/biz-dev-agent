import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Production ビルド時に TypeScript エラーを無視
    ignoreBuildErrors: true,
  },
  eslint: {
    // Production ビルド時に ESLint エラーを無視
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
