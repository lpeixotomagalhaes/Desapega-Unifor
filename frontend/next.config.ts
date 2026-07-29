import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Anúncios usam URLs de imagem externas informadas pelo usuário
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
