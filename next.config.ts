import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // រូបផលិតផល (បង្រួមរួចក្នុង browser) — Vercel អនុញ្ញាតអតិបរមា ~4.5MB
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    // អនុញ្ញាតរូបពី Supabase Storage
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
