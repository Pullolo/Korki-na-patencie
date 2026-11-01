import type { NextConfig } from "next"

/**
 * Nagłówki bezpieczeństwa dla całego serwisu.
 *
 * Bez CSP — ten dokładamy w `proxy.ts` przez Clerka, bo tylko on wie, jakie
 * adresy jego widżet logowania musi mieć otwarte, i tylko tam da się podać
 * nonce dla skryptów Nexta.
 */
const securityHeaders = [
  // Przeglądarka nie zgaduje typu pliku — zgadywanie to droga do XSS-a
  // przez „obrazek", który okazuje się skryptem.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Panel i strona statusu zgłoszenia nie mają czego robić w cudzej ramce.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Do obcych serwisów wychodzi sam adres domeny, bez ścieżki — inaczej
  // kod rezerwacji z `/rezerwacja/[kod]` wyciekłby w nagłówku Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Niczego z tych API nie używamy.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS ma sens dopiero na prawdziwej domenie po HTTPS; na localhoście
  // zablokowałby pracę, więc dokładamy go tylko na produkcji.
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  // Wersja Nexta w nagłówku to darmowa podpowiedź dla skanera podatności.
  poweredByHeader: false,

  images: {
    // Avatary nauczycieli i uczniów przychodzą z Clerka. Bez tego wpisu
    // `next/image` odrzuca te adresy jako zewnętrzne.
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },

  experimental: {
    // `lucide-react`, `date-fns` i `recharts` Next optymalizuje sam;
    // Base UI nie jest na jego liście, a to z niego zbudowany cały panel.
    optimizePackageImports: ["@base-ui/react"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
