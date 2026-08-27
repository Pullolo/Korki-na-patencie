/**
 * Slugi, których strona CMS nie może zająć.
 *
 * `/[slug]` łapie wszystko, co nie pasuje do trasy statycznej. Next rozstrzyga
 * segmenty statyczne przed dynamicznymi, więc kolizji w runtime nie ma — ale
 * strona założona w panelu pod slugiem `cennik` nigdy by się nie otworzyła
 * i nikt by się o tym nie dowiedział. Dlatego edytor stron sprawdza tę listę,
 * a `app/sitemap.ts` czyta ją, żeby nie zgłosić trasy dwa razy.
 */
export const RESERVED_SLUGS = [
  "terminy",
  "nauczyciele",
  "przedmioty",
  "cennik",
  "grupy",
  "opinie",
  "faq",
  "kontakt",
  "rezerwacja",
  "zapis",
  "konto",
  "dashboard",
  "sign-in",
  "sign-up",
  "api",
  "sitemap.xml",
  "robots.txt",
  "manifest.webmanifest",
  "opengraph-image",
] as const

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.includes(slug.toLowerCase() as (typeof RESERVED_SLUGS)[number])
}
