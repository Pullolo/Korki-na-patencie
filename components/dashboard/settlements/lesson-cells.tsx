"use client"

import { Check, Loader2 } from "lucide-react"
import { useState } from "react"

import { inputClass } from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import {
  setLessonPaidOut,
  setLessonPaymentMethod,
  setLessonPayout,
} from "@/lib/actions/settlements"
import type { PaymentMethod } from "@/lib/generated/prisma/enums"
import { PAYMENT_METHOD_LABELS } from "@/lib/labels"
import { cn } from "@/lib/utils"

/**
 * Komórki rozliczenia edytuje się w miejscu, tak jak w arkuszu — wejście na
 * osobną stronę po każdej kwocie zabiłoby sens tej tabeli. Każda komórka ma
 * własny `useServerAction()`, żeby błąd przy jednej kwocie nie gasił
 * potwierdzenia przy drugiej.
 */

/** „Moje (zł)" — ręczna korekta części nauczyciela za tę lekcję. */
export function PayoutCell({
  bookingId,
  payout,
}: {
  bookingId: string
  payout: number | null
}) {
  const { pending, error, done, run, reset } = useServerAction()
  const [text, setText] = useState(payout === null ? "" : String(payout))

  // Wartość zapisana na serwerze — bez niej każde opuszczenie pola
  // wysyłałoby tę samą kwotę jeszcze raz.
  const [saved, setSaved] = useState(text)

  function save() {
    const trimmed = text.trim()
    if (trimmed === saved.trim()) return

    const next = trimmed === "" ? null : Number(trimmed.replace(",", "."))
    if (next !== null && !Number.isFinite(next)) {
      setText(saved)
      return
    }
    run(
      () => setLessonPayout(bookingId, next),
      () => setSaved(trimmed),
      () => setText(saved)
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          reset()
        }}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
          if (event.key === "Escape") {
            setText(saved)
            event.currentTarget.blur()
          }
        }}
        disabled={pending}
        inputMode="decimal"
        placeholder="—"
        aria-label="Część nauczyciela w złotych"
        title={error ?? undefined}
        className={cn(
          inputClass,
          "w-20 px-2 py-1 text-right tabular-nums",
          error && "border-destructive"
        )}
      />
      {pending && (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
      )}
      {done && !pending && (
        <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      )}
    </div>
  )
}

const METHODS: PaymentMethod[] = ["ONLINE", "CASH"]

/** Jak uczeń zapłacił — pusta wartość znaczy „jeszcze nie wiadomo". */
export function PaymentMethodCell({
  bookingId,
  method,
}: {
  bookingId: string
  method: PaymentMethod | null
}) {
  const { pending, error, run } = useServerAction()
  const [value, setValue] = useState<PaymentMethod | "">(method ?? "")

  function change(next: string) {
    const previous = value
    const parsed = next === "" ? null : (next as PaymentMethod)
    setValue(parsed ?? "")
    run(
      () => setLessonPaymentMethod(bookingId, parsed),
      undefined,
      () => setValue(previous)
    )
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(event) => change(event.target.value)}
      aria-label="Sposób płatności"
      title={error ?? undefined}
      className={cn(
        inputClass,
        "w-28 px-2 py-1",
        error && "border-destructive",
        value === "" && "text-muted-foreground"
      )}
    >
      <option value="">— nie wiem</option>
      {METHODS.map((item) => (
        <option key={item} value={item}>
          {PAYMENT_METHOD_LABELS[item]}
        </option>
      ))}
    </select>
  )
}

/** „Wypłacone? (TAK/NIE)" — jedno kliknięcie, bez formularza. */
export function PaidOutCell({
  bookingId,
  paidOut,
}: {
  bookingId: string
  paidOut: boolean
}) {
  const { pending, error, run } = useServerAction()
  const [value, setValue] = useState(paidOut)

  function toggle() {
    const next = !value
    // Optymistycznie, bo to przycisk klikany seriami przy rozliczaniu
    // miesiąca; przy błędzie wracamy do poprzedniego stanu.
    setValue(next)
    run(
      () => setLessonPaidOut(bookingId, next),
      undefined,
      () => setValue(!next)
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={
        error ?? (value ? "Oznacz jako niewypłacone" : "Oznacz jako wypłacone")
      }
      aria-pressed={value}
      className={cn(
        "inline-flex w-20 cursor-pointer items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50",
        value
          ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
        error && "ring-1 ring-destructive"
      )}
    >
      {pending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <>{value ? "TAK" : "NIE"}</>
      )}
    </button>
  )
}
