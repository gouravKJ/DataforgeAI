import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // pin the workspace root (a stray lockfile in the home dir confuses inference)
  outputFileTracingRoot: process.cwd(),
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
