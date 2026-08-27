"use client"

import { CalendarX2, CircleCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  errorInputClass,
  Field,
  fieldProps,
  FormError,
  inputClass,
} from "@/components/front/forms/field"
import { btnSecondary } from "@/components/front/styles"
import { useFormAction } from "@/hooks/use-form-action"
import type { CancelBookingResult } from "@/lib/actions/public/booking"
import { cancelOwnBooking } from "@/lib/actions/public/booking"
import { cn } from "@/lib/utils"

/**
 * Odwołanie lekcji przez ucznia. Formularz otwiera się dopiero po kliknięciu —
 * na stronie statusu najważniejsze jest to, że rezerwacja istnieje, a nie to,
 * że da się ją skasować.
 */
export function CancelBooking({
  reference,
  deadlineLabel,
}: {
  reference: string
  deadlineLabel: string
}) {
  const router = useRouter()
  const form = useFormAction<CancelBookingResult>()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")

  if (form.result?.ok) {
    return (
      <p className="flex items-center gap-2 font-semibold text-front-mint">
        <CircleCheck className="size-5 shrink-0" />
        Lekcja odwołana. Nauczyciel dostał powiadomienie.
      </p>
    )
  }

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={btnSecondary}
        >
          <CalendarX2 />
          Odwołaj lekcję
        </button>
        <p className="mt-2 font-body text-sm text-front-muted">
          Bez kosztów do {deadlineLabel}.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.submit(() => cancelOwnBooking({ reference, reason }), (result) => {
          if (result.ok) router.refresh()
        })
      }}
      className="grid gap-4"
    >
      <Field
        label="Dlaczego odwołujesz?"
        htmlFor="reason"
        optional
        hint="Jedno zdanie wystarczy — nauczyciel zobaczy je przy rezerwacji."
        error={form.errors.reason}
      >
        <input
          {...fieldProps("reason", form.errors.reason)}
          type="text"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            form.clearError("reason")
          }}
          className={cn(inputClass, form.errors.reason && errorInputClass)}
        />
      </Field>

      <FormError message={form.formError} />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={form.pending}
          className={cn(
            btnSecondary,
            "border-front-coral text-front-coral shadow-[0_4px_0_0_var(--front-coral-soft)]"
          )}
        >
          <CalendarX2 />
          {form.pending ? "Odwołuję…" : "Potwierdź odwołanie"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={btnSecondary}
        >
          Zostawiam termin
        </button>
      </div>
    </form>
  )
}
