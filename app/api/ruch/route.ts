import { after, type NextRequest } from "next/server"

import { prisma } from "@/lib/prisma"

/**
 * Odbiór odsłon ze strony publicznej.
 *
 * Co zapisujemy: ścieżkę, sam host odsyłacza, identyfikator sesji z
 * `sessionStorage`, typ urządzenia i kraj z nagłówka geolokalizacji.
 * Czego nie: adresu IP ani niczego, co pozwoliłoby wskazać osobę — licznik
 * odsłon nie jest tego wart (`docs/FRONTEND.md`, sekcja 10).
 *
 * Odpowiadamy natychmiast, a zapis idzie po odpowiedzi (`after`): beacon
 * z przeglądarki nie ma na co czekać, a wolna baza nie może spowalniać
 * przejścia między stronami.
 */

const BOT = /bot|crawl|spider|slurp|preview|monitor|lighthouse|headless/i

function deviceFrom(userAgent: string) {
  if (/tablet|ipad/i.test(userAgent)) return "tablet"
  if (/mobi|android|iphone/i.test(userAgent)) return "mobile"
  return "desktop"
}

/**
 * Ścieżki z kodem zbieramy pod jedną etykietą. Kod rezerwacji jest kluczem
 * dostępu do cudzego zgłoszenia — nie ma powodu, żeby leżał w tabeli odsłon.
 */
function normalizePath(path: string) {
  return path
    .replace(/^\/rezerwacja\/[^/]+$/, "/rezerwacja/[kod]")
    .replace(/^\/zapis\/[^/]+$/, "/zapis/[kod]")
}

/** Sam host odsyłacza — pełny adres z parametrami bywa danymi osobowymi. */
function referrerHost(value: unknown) {
  if (typeof value !== "string" || !value) return null
  try {
    return new URL(value).host || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? ""
  if (BOT.test(userAgent)) {
    return new Response(null, { status: 204 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }

  const payload = body as { path?: unknown; referrer?: unknown; sessionId?: unknown }
  const path = typeof payload.path === "string" ? payload.path.slice(0, 300) : null

  if (!path || !path.startsWith("/")) {
    return new Response(null, { status: 400 })
  }
  // Panel, API i konto ucznia nie są ruchem na stronie.
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/api") ||
    path.startsWith("/konto")
  ) {
    return new Response(null, { status: 204 })
  }

  const sessionId =
    typeof payload.sessionId === "string"
      ? payload.sessionId.slice(0, 40)
      : null

  after(async () => {
    try {
      await prisma.pageView.create({
        data: {
          path: normalizePath(path),
          referrer: referrerHost(payload.referrer),
          sessionId,
          device: deviceFrom(userAgent),
          country: request.headers.get("x-vercel-ip-country"),
        },
      })
    } catch (error) {
      console.error("Nie udało się zapisać odsłony:", error)
    }
  })

  return new Response(null, { status: 204 })
}
