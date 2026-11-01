import type { MetadataRoute } from "next"

import { getSiteSettings } from "@/lib/public/settings"

/**
 * Manifest skrótu na ekranie głównym. Znaczna część ruchu to telefony
 * ucznia (`PRODUCT.md`, Accessibility), więc dodanie strony do ekranu
 * głównego ma wyglądać jak aplikacja, a nie jak zakładka bez nazwy.
 *
 * Nazwa idzie z ustawień serwisu, żeby zmiana w panelu nie wymagała
 * wejścia w kod. Slug `manifest.webmanifest` jest już zarezerwowany
 * w `lib/public/reserved-slugs.ts`.
 */
export const dynamic = "force-dynamic"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings()

  return {
    name: settings.siteName,
    short_name: settings.siteName,
    description:
      settings.seoDescription ||
      settings.tagline ||
      "Korepetycje z wolnym terminem — sprawdź godziny i zapisz się online.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#5b47e0",
    lang: "pl",
    icons: [
      { src: "/icon", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
  }
}
