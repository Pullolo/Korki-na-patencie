import { Fredoka, Nunito } from "next/font/google"

import { JsonLd } from "@/components/front/json-ld"
import { SiteFooter } from "@/components/front/layout/site-footer"
import { SiteHeader } from "@/components/front/layout/site-header"
import { TrafficBeacon } from "@/components/front/traffic-beacon"
import { getSiteSettings } from "@/lib/public/settings"
import { absoluteUrl } from "@/lib/seo"
import { cn } from "@/lib/utils"

/**
 * Powłoka strony publicznej.
 *
 * Grupa `(front)` nie zmienia żadnego adresu i nie tworzy drugiego root
 * layoutu — pełne przeładowanie przy przejściu front ↔ panel nie jest do
 * niczego potrzebne, a `data-surface="front"` wystarcza, żeby oba systemy
 * wizualne się nie mieszały (`DESIGN.md`, Sealed-Surface Rule).
 *
 * Fonty ładujemy tutaj, żeby każda podstrona nie musiała ich deklarować u siebie.
 */

const fredoka = Fredoka({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-fredoka",
})

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
})

export default async function FrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()

  // Wizytówka firmy dla wyszukiwarek. Bez oceny — patrz komentarz w `JsonLd`.
  const business = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: settings.siteName,
    url: absoluteUrl("/"),
    ...(settings.tagline ? { description: settings.tagline } : {}),
    ...(settings.contactPhone ? { telephone: settings.contactPhone } : {}),
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    ...(settings.contactAddress
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.contactAddress,
          },
        }
      : {}),
    ...(settings.logoUrl ? { logo: settings.logoUrl } : {}),
    sameAs: [settings.socialFacebook, settings.socialInstagram].filter(Boolean),
  }

  return (
    <div
      data-surface="front"
      className={cn(
        fredoka.variable,
        nunito.variable,
        "flex min-h-svh flex-col bg-front-ground font-body text-front-ink"
      )}
    >
      <JsonLd data={business} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <TrafficBeacon />
    </div>
  )
}
