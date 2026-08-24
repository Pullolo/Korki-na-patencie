"use client"

import { Check, CircleSlash, RotateCcw, UserX, X } from "lucide-react"
import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import { FormError, inputClass } from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  markNoShow,
  rejectBooking,
  reopenBooking,
} from "@/lib/actions/bookings"
import type { BookingStatus } from "@/lib/generated/prisma/enums"

export function BookingDetailActions({
  bookingId,
  status,
  isPast,
}: {
  bookingId: string
  status: BookingStatus
  /** Lekcja już się odbyła — wtedy proponujemy rozliczenie zamiast odwołania. */
  isPast: boolean
}) {
  const { pending, error, run } = useServerAction()
  const [reason, setReason] = useState("")

  const needsReason = status === "PENDING" || status === "CONFIRMED"

  return (
    <div className="space-y-3">
      {needsReason && (
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Powód odrzucenia lub odwołania (opcjonalny)"
          className={inputClass}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {status === "PENDING" && (
          <>
            <ActionButton
              variant="success"
              icon={<Check className="size-3.5" />}
              pending={pending}
              onClick={() => run(() => confirmBooking(bookingId))}
            >
              Potwierdź
            </ActionButton>
            <ActionButton
              variant="danger"
              icon={<X className="size-3.5" />}
              pending={pending}
              onClick={() => run(() => rejectBooking(bookingId, reason))}
            >
              Odrzuć
            </ActionButton>
          </>
        )}

        {status === "CONFIRMED" && (
          <>
            {isPast && (
              <>
                <ActionButton
                  variant="success"
                  icon={<Check className="size-3.5" />}
                  pending={pending}
                  onClick={() => run(() => completeBooking(bookingId))}
                >
                  Lekcja się odbyła
                </ActionButton>
                <ActionButton
                  variant="danger"
                  icon={<UserX className="size-3.5" />}
                  pending={pending}
                  onClick={() => run(() => markNoShow(bookingId))}
                >
                  Uczeń nie przyszedł
                </ActionButton>
              </>
            )}
            <ActionButton
              variant="ghost"
              icon={<CircleSlash className="size-3.5" />}
              pending={pending}
              onClick={() => run(() => cancelBooking(bookingId, reason))}
            >
              Odwołaj
            </ActionButton>
          </>
        )}

        {status !== "PENDING" && (
          <ActionButton
            variant="ghost"
            icon={<RotateCcw className="size-3.5" />}
            pending={pending}
            title="Cofa decyzję i wraca do kolejki oczekujących"
            onClick={() => run(() => reopenBooking(bookingId))}
          >
            Cofnij decyzję
          </ActionButton>
        )}
      </div>

      <FormError message={error} />
    </div>
  )
}
