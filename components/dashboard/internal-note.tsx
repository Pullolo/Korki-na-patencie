"use client"

import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import { FormError, inputClass } from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import { updateInternalNote } from "@/lib/actions/bookings"

/** Notatka widoczna tylko w panelu — uczeń jej nie zobaczy. */
export function InternalNote({
  bookingId,
  note,
}: {
  bookingId: string
  note: string | null
}) {
  const { pending, error, done, run, reset } = useServerAction()
  const [value, setValue] = useState(note ?? "")

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        rows={3}
        placeholder="np. uczeń prosi o materiały przed lekcją"
        onChange={(event) => {
          setValue(event.target.value)
          reset()
        }}
        className={`${inputClass} resize-y`}
      />
      <FormError message={error} />
      <ActionButton
        pending={pending}
        done={done}
        doneLabel="Zapisano"
        onClick={() => run(() => updateInternalNote(bookingId, value))}
      >
        Zapisz notatkę
      </ActionButton>
    </div>
  )
}
