"use client"

import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { btnPrimary, cardBase } from "@/components/front/styles"
import { cn } from "@/lib/utils"

/**
 * Tylko ścieżka we własnym serwisie — `redirect_url` przychodzi z adresu,
 * więc nie wolno go użyć bez sprawdzenia (otwarte przekierowanie).
 */
function safeTarget(raw: string | null) {
  if (!raw) return "/"
  try {
    const url = new URL(raw, window.location.origin)
    if (url.origin !== window.location.origin) return "/"
    return `${url.pathname}${url.search}`
  } catch {
    return "/"
  }
}

/**
 * Formularz Clerka nie pokazuje nic, kiedy sesja w przeglądarce jest już
 * aktywna — a trafić tu można właśnie z aktywną sesją, gdy serwer jej nie
 * rozpoznał. Zamiast pustego ekranu dajemy wyjście dalej.
 *
 * Świadomie bez automatycznego przekierowania: jeśli serwer nadal nie widzi
 * sesji, odesłanie z powrotem zapętliłoby przeglądarkę.
 */
export function AlreadySignedIn() {
  const { isLoaded, isSignedIn } = useAuth()
  const params = useSearchParams()

  if (!isLoaded || !isSignedIn) return null

  const target = safeTarget(params.get("redirect_url"))

  return (
    <div
      className={cn(cardBase, "w-full max-w-md space-y-4 p-6 text-center")}
      role="status"
    >
      <h1 className="font-display text-xl font-bold text-front-ink">
        Jesteś już zalogowany
      </h1>
      <p className="font-body text-sm text-front-muted">
        Jeżeli strona wciąż prosi o logowanie, odśwież ją — sesja odnawia się
        przy pełnym wejściu.
      </p>
      <Link href={target} className={cn(btnPrimary, "w-full")}>
        Idź dalej
      </Link>
    </div>
  )
}
