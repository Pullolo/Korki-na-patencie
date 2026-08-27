import type { MetadataRoute } from "next"

import { getSiteSettings } from "@/lib/public/settings"
import { absoluteUrl } from "@/lib/seo"

/**
 * Zamknięte przed robotami: panel, konto ucznia i strony pod kodem.
 * Kod rezerwacji jest kluczem dostępu — nie ma prawa trafić do wyszukiwarki.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings()

  if (settings.noIndexSite) {
    return { rules: { userAgent: "*", disallow: "/" } }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/konto", "/rezerwacja/", "/zapis/", "/api"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
