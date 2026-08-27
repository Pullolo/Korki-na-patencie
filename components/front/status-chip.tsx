import type { BookingStatus, EnrollmentStatus } from "@/lib/generated/prisma/enums"
import { BOOKING_STATUS_LABELS } from "@/lib/labels"
import { cn } from "@/lib/utils"

/**
 * Status zgłoszenia w języku wizualnym frontu.
 *
 * To jest ta czwarta kategoria, na którą czekał `--front-coral` (`DESIGN.md`,
 * Secondary): odrzucona i odwołana rezerwacja. Mięta zostaje przy dostępności
 * i potwierdzeniach, słońce przy oczekiwaniu, błękit przy tym, co już było.
 */
const BOOKING_TONES: Record<BookingStatus, string> = {
  PENDING: "bg-front-sun-soft text-front-sun",
  CONFIRMED: "bg-front-mint-soft text-front-mint",
  REJECTED: "bg-front-coral-soft text-front-coral",
  CANCELLED: "bg-front-coral-soft text-front-coral",
  COMPLETED: "bg-front-sky-soft text-front-sky",
  NO_SHOW: "bg-front-coral-soft text-front-coral",
}

const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  ACTIVE: "Zapisany",
  WAITLIST: "Lista rezerwowa",
  CANCELLED: "Rezygnacja",
  FINISHED: "Zakończone",
}

const ENROLLMENT_TONES: Record<EnrollmentStatus, string> = {
  ACTIVE: "bg-front-mint-soft text-front-mint",
  WAITLIST: "bg-front-sun-soft text-front-sun",
  CANCELLED: "bg-front-coral-soft text-front-coral",
  FINISHED: "bg-front-sky-soft text-front-sky",
}

export function BookingStatusChip({
  status,
  className,
}: {
  status: BookingStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1.5 font-body text-sm font-bold",
        BOOKING_TONES[status],
        className
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  )
}

export function EnrollmentStatusChip({
  status,
  className,
}: {
  status: EnrollmentStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1.5 font-body text-sm font-bold",
        ENROLLMENT_TONES[status],
        className
      )}
    >
      {ENROLLMENT_LABELS[status]}
    </span>
  )
}
