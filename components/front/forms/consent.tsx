"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"

import { btnPrimary } from "@/components/front/styles"
import { cn } from "@/lib/utils"

/**
 * Zgoda na kontakt. Formularze zbierają imię, telefon i mail — to dane
 * osobowe, więc przy każdym z nich jest pole zgody z linkiem do polityki
 * prywatności (`docs/FRONTEND.md`, sekcja 6).
 */
export function Consent({
  checked,
  onChange,
  error,
  id = "consent",
}: {
  checked: boolean
  onChange: (value: boolean) => void
  error?: string | null
  id?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 font-body text-sm leading-relaxed text-front-muted"
      >
        <input
          type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-[var(--front-brand-solid)]"
        />
        <span>
          Zgadzam się na kontakt w sprawie tego zgłoszenia i na przetwarzanie
          podanych danych.{" "}
          <Link
            href="/polityka-prywatnosci"
            className="font-semibold text-front-brand hover:underline"
          >
            Polityka prywatności
          </Link>
          .
        </span>
      </label>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 font-body text-sm font-semibold text-front-coral"
        >
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Pole-pułapka. Człowiek go nie widzi (poza ekranem, `tabindex=-1`,
 * `aria-hidden`), bot wypełnia wszystko, co znajdzie. Wartość idzie do akcji
 * razem z resztą formularza — wypełnione pole kończy się cichym „sukcesem".
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="firma">Nie wypełniaj tego pola</label>
      <input
        type="text"
        id="firma"
        name="firma"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function SubmitButton({
  pending,
  children,
  className,
  disabled,
}: {
  pending: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(btnPrimary, className)}
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </button>
  )
}
