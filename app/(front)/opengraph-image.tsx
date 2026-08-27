import { ImageResponse } from "next/og"

import { getSiteSettings } from "@/lib/public/settings"

/**
 * Domyślny obraz linku. Bez niego wklejony adres wygląda jak surowy tekst,
 * a serwis, który sprzedaje „widać wolny termin", nie może wyglądać
 * na porzucony w podglądzie linku.
 *
 * Rysujemy go z tokenów marki, ale wpisanych wprost: `ImageResponse` renderuje
 * w satori, gdzie nie ma zmiennych CSS ani Tailwinda z naszego arkusza.
 */
export const alt = "Korki na patencie — korepetycje z wolnym terminem"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const BRAND = "#5b47e0"
const INK = "#1a1830"
const MUTED = "#5a5878"
const SURFACE = "#ffffff"
const SOFT = "#eeebff"

export default async function OpengraphImage() {
  const settings = await getSiteSettings()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: SURFACE,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              background: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: SURFACE,
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            {settings.siteName.trim()[0]?.toUpperCase() ?? "K"}
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: INK }}>
            {settings.siteName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Zobacz wolną godzinę i zapisz się w minutę
          </div>
          <div style={{ fontSize: 34, color: MUTED, maxWidth: 860 }}>
            {settings.tagline ??
              "Korepetycje z grafikiem, który mówi prawdę o wolnych terminach."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {["Płacisz po lekcji", "Bez zakładania konta", "Online i na miejscu"].map(
            (label) => (
              <div
                key={label}
                style={{
                  background: SOFT,
                  color: BRAND,
                  fontSize: 26,
                  fontWeight: 600,
                  padding: "14px 26px",
                  borderRadius: 999,
                  display: "flex",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    size
  )
}
