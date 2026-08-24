"use client"

import { Check, X } from "lucide-react"

import { ActionButton } from "@/components/dashboard/action-button"
import { useServerAction } from "@/hooks/use-server-action"
import { confirmBooking, rejectBooking } from "@/lib/actions/bookings"
import type { BookingStatus } from "@/lib/generated/prisma/enums"

/** Szybkie decyzje z listy; pełny zestaw akcji jest na stronie rezerwacji. */
export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string
  status: BookingStatus
}) {
  const { pending, error, run } = useServerAction()

  if (status !== "PENDING") return null

  return (
    <div className="flex items-center justify-end gap-1.5">
      {error && (
        <span className="max-w-48 text-right text-xs text-destructive">
          {error}
        </span>
      )}
      <ActionButton
        variant="success"
        pending={pending}
        icon={<Check className="size-3.5" />}
        title="Potwierdź rezerwację"
        className="px-2 py-1"
        onClick={() => run(() => confirmBooking(bookingId))}
      >
        Potwierdź
      </ActionButton>
      <ActionButton
        variant="danger"
        pending={pending}
        icon={<X className="size-3.5" />}
        title="Odrzuć rezerwację"
        className="px-2 py-1"
        onClick={() => run(() => rejectBooking(bookingId))}
      >
        Odrzuć
      </ActionButton>
    </div>
  )
}
