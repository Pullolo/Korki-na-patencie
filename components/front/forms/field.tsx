import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Pola formularzy publicznych.
 *
 * Osobne od `components/dashboard/form-controls.tsx`: panel jest skalowany pod
 * gęstą siatkę (wysokość 30 px), a tu cele dotykowe muszą mieć co najmniej
 * 44 px, bo pierwszym czytelnikiem jest uczeń z telefonu.
 *
 * Błąd wisi pod polem i jest podpięty przez `aria-describedby`, żeby czytnik
 * ekranu przeczytał go razem z etykietą.
 */

export const inputClass =
  "w-full min-h-12 rounded-xl border-2 border-front-line bg-front-surface px-4 py-2.5 font-body text-base text-front-ink transition-colors placeholder:text-front-muted/70 hover:border-front-line-strong focus:border-front-brand focus:outline-none disabled:opacity-60"

export const textareaClass = cn(inputClass, "min-h-28 resize-y py-3")

export const errorInputClass = "border-front-coral hover:border-front-coral"

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string | null
  optional?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block font-body text-sm font-bold text-front-ink"
      >
        {label}
        {optional && (
          <span className="ml-1.5 font-semibold text-front-muted">
            (opcjonalnie)
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p
          id={`${htmlFor}-hint`}
          className="mt-1.5 font-body text-sm text-front-muted"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="mt-1.5 flex items-start gap-1.5 font-body text-sm font-semibold text-front-coral"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/** Atrybuty dostępności pola: opis błędu albo podpowiedzi. */
export function fieldProps(id: string, error?: string | null, hint?: string) {
  return {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error
      ? `${id}-error`
      : hint
        ? `${id}-hint`
        : undefined,
  }
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-front-coral-soft px-4 py-3 font-body text-sm font-semibold text-front-coral"
    >
      <TriangleAlert className="mt-0.5 size-4.5 shrink-0" />
      {message}
    </p>
  )
}
