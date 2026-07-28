import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // allowedDevOrigins: ["192.168.74.1"],
  allowedDevOrigins: ["172.22.16.1"],
  // Sharp là native Node module, phải exclude khỏi webpack bundling
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
