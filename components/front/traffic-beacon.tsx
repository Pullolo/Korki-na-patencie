"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * Licznik odsłon. `sendBeacon` wysyła dane w tle i nie blokuje przejścia
 * między stronami; gdy przeglądarka go nie ma, wracamy do `fetch` z
 * `keepalive`.
 *
 * Identyfikator sesji żyje w `sessionStorage` — po zamknięciu karty znika
 * i nie łączy wizyt w profil. To nie jest ciasteczko śledzące, więc nie
 * dokłada zgody na ciasteczka.
 */
export function TrafficBeacon() {
  const pathname = usePathname()
  const lastSent = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    // Zmiana samych parametrów filtrów to nadal ta sama odsłona — dlatego
    // patrzymy wyłącznie na ścieżkę i nie sięgamy po `useSearchParams()`,
    // które wymagałoby granicy Suspense wokół komponentu.
    if (lastSent.current === pathname) return
    lastSent.current = pathname

    let sessionId: string | null = null
    try {
      sessionId = sessionStorage.getItem("ruch-sesja")
      if (!sessionId) {
        sessionId = crypto.randomUUID().slice(0, 36)
        sessionStorage.setItem("ruch-sesja", sessionId)
      }
    } catch {
      // Tryb prywatny albo zablokowany magazyn — odsłona poleci bez sesji.
    }

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      sessionId,
    })

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/ruch",
          new Blob([payload], { type: "application/json" })
        )
      } else {
        void fetch("/api/ruch", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        })
      }
    } catch {
      // Licznik odsłon nie ma prawa wywrócić strony.
    }
  }, [pathname])

  return null
}
