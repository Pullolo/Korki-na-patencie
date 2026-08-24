"use client"

import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-destructive/10">
          <AlertTriangle className="size-5 text-destructive" />
        </div>
        <h1 className="text-base font-semibold text-foreground">
          Coś poszło nie tak
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Najczęstsza przyczyna na tym etapie to brak połączenia z bazą danych.
          Sprawdź, czy Postgres działa i czy DATABASE_URL jest poprawny.
        </p>
        <button
          onClick={reset}
          className="mt-5 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Spróbuj ponownie
        </button>
      </div>
    </div>
  )
}
