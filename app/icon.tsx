import { ImageResponse } from "next/og"

/**
 * Ikona karty i skrótu. `favicon.ico` z etapu 1 zostaje dla starych
 * przeglądarek — ta wersja daje ostry znak w rozdzielczościach, których
 * ikona 32 px nie obsłuży, i tę samą czapkę co `BrandMark`.
 *
 * Rysowana wprost w SVG, bo `ImageResponse` renderuje w satori: nie ma tam
 * ani lucide, ani Tailwinda, ani zmiennych CSS.
 */
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

const BRAND = "#5b47e0"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND,
        borderRadius: 40,
      }}
    >
      {/* Czapka absolwenta — ten sam kształt co ikona lucide w nagłówku. */}
      <svg
        width="112"
        height="112"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </svg>
    </div>,
    size
  )
}
