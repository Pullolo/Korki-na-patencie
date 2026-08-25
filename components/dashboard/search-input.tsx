"use client"

import { Loader2, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

import { inputClass } from "@/components/dashboard/form-controls"
import { cn } from "@/lib/utils"

/** Ile ciszy przy klawiaturze czekamy, zanim ruszymy po dane. */
const DEBOUNCE_MS = 300

/**
 * Fraza siedzi w query stringu — dzięki temu wynik da się zalinkować, przeżywa
 * odświeżenie i filtruje w bazie, a nie tylko widoczną stronę listy.
 */
export function SearchInput({
  paramKey,
  basePath,
  value,
  placeholder,
  extraParams,
  className,
}: {
  paramKey: string
  basePath: string
  /** Fraza z URL-a — startowa wartość pola. */
  value: string
  placeholder?: string
  /** Parametry, które przy szukaniu mają zostać w URL-u (np. sortowanie). */
  extraParams?: Record<string, string | undefined>
  className?: string
}) {
  const router = useRouter()
  const [text, setText] = useState(value)
  const [pending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function go(next: string) {
    if (timer.current) clearTimeout(timer.current)
    const params = new URLSearchParams()
    const trimmed = next.trim()
    if (trimmed) params.set(paramKey, trimmed)
    for (const [key, param] of Object.entries(extraParams ?? {})) {
      if (param) params.set(key, param)
    }
    const query = params.toString()
    // `replace` + `scroll: false`: pisanie nie zaśmieca historii ani nie skacze do góry.
    startTransition(() =>
      router.replace(query ? `${basePath}?${query}` : basePath, {
        scroll: false,
      })
    )
  }

  function onChange(next: string) {
    setText(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => go(next), DEBOUNCE_MS)
  }

  function clear() {
    setText("")
    go("")
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={text}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            go(text)
          }
          if (event.key === "Escape") clear()
        }}
        placeholder={placeholder}
        aria-label={placeholder ?? "Szukaj"}
        className={cn(
          inputClass,
          "pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        )}
      />
      {pending ? (
        <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        text && (
          <button
            type="button"
            onClick={clear}
            aria-label="Wyczyść wyszukiwanie"
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )
      )}
    </div>
  )
}
