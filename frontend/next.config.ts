import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Anúncios: URLs externas (seed) + uploads servidos pela API local
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/uploads/**" },
    ],
  },
};

export default nextConfig;
