"use client"

import { RotateCcw, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

import { btnPrimary, btnSecondary } from "@/components/front/styles"

export default function FrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Błąd strony publicznej:", error)
  }, [error])

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-6 sm:py-28">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-front-coral-soft text-front-coral">
        <TriangleAlert className="size-6" />
      </span>
      <h1 className="mt-6 max-w-[20ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
        Coś się popsuło po naszej stronie
      </h1>
      <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-front-muted">
        Spróbuj jeszcze raz. Jeśli to nie pomoże, napisz do nas — termin
        umówimy ręcznie, bez czekania na poprawkę.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={btnPrimary}>
          <RotateCcw />
          Spróbuj ponownie
        </button>
        <Link href="/kontakt" className={btnSecondary}>
          Napisz do nas
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 font-body text-sm text-front-muted">
          Numer błędu: <span className="tabular-nums">{error.digest}</span>
        </p>
      )}
    </section>
  )
}
