"use client"

import { useState, useTransition } from "react"

/**
 * Server actions rzucają wyjątkiem, a każdy formularz w panelu potrzebuje tego
 * samego: stanu „w toku", komunikatu błędu po polsku i potwierdzenia zapisu.
 * Zamiast powielać ten sam useTransition w każdym komponencie.
 */
export function useServerAction() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function run(
    action: () => Promise<unknown>,
    onSuccess?: () => void,
    onError?: () => void
  ) {
    setError(null)
    setDone(false)
    startTransition(async () => {
      try {
        await action()
        setDone(true)
        onSuccess?.()
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Nie udało się zapisać zmiany."
        )
        // Do cofnięcia optymistycznej zmiany w interfejsie.
        onError?.()
      }
    })
  }

  /** Do wywołania przy edycji pola — chowa „Zapisano" po zmianie wartości. */
  function reset() {
    setDone(false)
    setError(null)
  }

  return { pending, error, done, run, reset }
}
