import { cachedQuery } from "@/lib/public/cache"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

/**
 * Ustawienia serwisu dla strony publicznej.
 *
 * Front nigdy nie pyta o cały wiersz przez `prisma` — filtr widoczności i
 * wartości domyślne mają mieszkać w jednym miejscu. Gdy bazy nie ma (świeży
 * klon, wyłączony kontener), strona ma się wyświetlić z wartościami zapasowymi,
 * a nie wywalić.
 */

export type PublicSettings = {
  siteName: string
  tagline: string | null
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactAddress: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoOgImage: string | null
  noIndexSite: boolean
  currency: string
  bookingMinLeadHours: number
  bookingMaxAdvanceDays: number
  bookingAutoConfirm: boolean
  groupDiscountPercent: number
}

export const DEFAULT_SETTINGS: PublicSettings = {
  siteName: "Korki na patencie",
  tagline: "Korepetycje, na które faktycznie się zapiszesz",
  logoUrl: null,
  contactEmail: null,
  contactPhone: null,
  contactAddress: null,
  socialFacebook: null,
  socialInstagram: null,
  seoTitle: null,
  seoDescription: null,
  seoOgImage: null,
  noIndexSite: false,
  currency: "PLN",
  bookingMinLeadHours: 12,
  bookingMaxAdvanceDays: 60,
  bookingAutoConfirm: false,
  groupDiscountPercent: 20,
}

const load = cachedQuery(
  async () =>
    prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        siteName: true,
        tagline: true,
        logoUrl: true,
        contactEmail: true,
        contactPhone: true,
        contactAddress: true,
        socialFacebook: true,
        socialInstagram: true,
        seoTitle: true,
        seoDescription: true,
        seoOgImage: true,
        noIndexSite: true,
        currency: true,
        bookingMinLeadHours: true,
        bookingMaxAdvanceDays: true,
        bookingAutoConfirm: true,
        groupDiscountPercent: true,
      },
    }),
  ["public-settings"],
  [TAGS.ustawienia]
)

export async function getSiteSettings(): Promise<PublicSettings> {
  try {
    return (await load()) ?? DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}
