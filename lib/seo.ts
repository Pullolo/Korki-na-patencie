import type { Metadata } from "next"

/**
 * Bez bezwzględnego adresu OG i canonical wychodzą ze ścieżkami względnymi,
 * a te nie działają w żadnym podglądzie linku. Wartość ustawia
 * `NEXT_PUBLIC_SITE_URL`; lokalnie wystarczy adres dev servera.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "")

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/** Ucina opis do długości, która nie zostanie przycięta w wynikach wyszukiwania. */
export function seoDescription(value: string | null | undefined, fallback: string) {
  const text = (value ?? "").trim() || fallback
  return text.length <= 160 ? text : `${text.slice(0, 157).trimEnd()}…`
}

/**
 * Kolejność źródeł jest zawsze ta sama: pole SEO encji → ustawienia serwisu →
 * wartość domyślna. Dzięki temu admin może nadpisać dowolną stronę, nie
 * dotykając kodu.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: {
  title: string
  description: string
  path: string
  image?: string | null
  noIndex?: boolean
}): Metadata {
  const url = absoluteUrl(path)
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "pl_PL",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
