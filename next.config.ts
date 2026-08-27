import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Avatary nauczycieli i uczniów przychodzą z Clerka. Bez tego wpisu
    // `next/image` odrzuca te adresy jako zewnętrzne.
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
}

export default nextConfig
