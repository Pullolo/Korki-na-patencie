"use client"

import { useState, useTransition } from "react"

import type { FieldErrors } from "@/lib/validation"

/**
 * Hook formularzy publicznych.
 *
 * Panelowy `useServerAction()` łapie wyjątek i pokazuje jeden komunikat na
 * całą operację — to wystarcza przy formularzu, który wypełnia nauczyciel.
 * Formularz na stronie dostaje wejście od nieznajomego i musi podświetlić
 * konkretne pole, więc akcje publiczne zwracają `{ ok, errors }` zamiast
 * rzucać, a ten hook rozkłada wynik na stan.
 */
export function useFormAction<
  TResult extends { ok: boolean; errors?: FieldErrors },
>() {
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [result, setResult] = useState<TResult | null>(null)

  function submit(run: () => Promise<TResult>, onSuccess?: (value: TResult) => void) {
    setErrors({})
    startTransition(async () => {
      try {
        const value = await run()
        setResult(value)
        if (value.ok) {
          onSuccess?.(value)
        } else {
          setErrors(value.errors ?? {})
        }
      } catch {
        // Wyjątek z akcji to awaria, nie błąd walidacji — jedno zdanie
        // nad przyciskiem wystarczy.
        setErrors({
          _: "Coś poszło nie tak po naszej stronie. Spróbuj jeszcze raz albo zadzwoń.",
        })
      }
    })
  }

  /** Czyści błąd pola, gdy ktoś zaczyna je poprawiać. */
  function clearError(field: string) {
    setErrors((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  return {
    pending,
    errors,
    /** Błąd niezwiązany z żadnym polem — nad przyciskiem wysyłki. */
    formError: errors._ ?? null,
    result,
    submit,
    clearError,
    reset: () => {
      setErrors({})
      setResult(null)
    },
  }
}
