import { ArrowRight, Clock3, MapPin, User } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CancelBooking } from "@/components/front/booking/cancel-booking"
import { PageHero } from "@/components/front/layout/page-hero"
import { BookingStatusChip } from "@/components/front/status-chip"
import { btnSecondary, cardBase } from "@/components/front/styles"
import { formatDateTime, formatPrice } from "@/lib/format"
import type { BookingStatus } from "@/lib/generated/prisma/enums"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import type { LocationType } from "@/lib/generated/prisma/enums"
import { getBookingByReference } from "@/lib/public/bookings"
import { getSiteSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

/** Strona pod kodem nie ma czego szukać w wyszukiwarce. */
export const metadata: Metadata = {
  title: "Status zgłoszenia",
  robots: { index: false, follow: false },
}

/** Kwota ma sens tylko tam, gdzie lekcja się odbędzie albo odbyła. */
const CHARGEABLE: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"]

const EXPLANATION: Record<BookingStatus, string> = {
  PENDING:
    "Zgłoszenie czeka na potwierdzenie nauczyciela. Termin jest już zablokowany, więc nikt inny go nie zajmie.",
  CONFIRMED:
    "Termin jest potwierdzony. Do zobaczenia — płacisz dopiero po lekcji.",
  REJECTED:
    "Nauczyciel nie może poprowadzić tej lekcji. Wybierz inny termin albo napisz do nas, a poszukamy razem.",
  CANCELLED: "Ta lekcja została odwołana.",
  COMPLETED: "Lekcja się odbyła. Dzięki!",
  NO_SHOW: "Uczeń nie pojawił się na tej lekcji.",
}

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ kod: string }>
}) {
  const { kod } = await params
  const booking = await getBookingByReference(kod)
  if (!booking) notFound()

  const settings = await getSiteSettings()
  const status = booking.status as BookingStatus
  const canCancel =
    (status === "PENDING" || status === "CONFIRMED") &&
    booking.cancelDeadline > new Date()

  return (
    <>
      <PageHero
        crumbs={[{ label: "Rezerwacja", href: "/rezerwacja" }, { label: kod.toUpperCase() }]}
        title={
          status === "PENDING"
            ? "Zgłoszenie przyjęte"
            : status === "CONFIRMED"
              ? "Termin potwierdzony"
              : "Status zgłoszenia"
        }
        lead={EXPLANATION[status]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <BookingStatusChip status={status} />
          <span className="font-body text-sm font-bold text-front-muted">
            Kod: <span className="tabular-nums">{booking.reference}</span>
          </span>
        </div>
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
          <div className={cn(cardBase, "p-6 sm:p-8")}>
            <p className="font-display text-3xl leading-tight font-semibold">
              {booking.dayLabel}, {booking.timeLabel}
            </p>

            <ul className="mt-4 grid gap-2 text-front-muted">
              <li className="flex items-center gap-2.5">
                <User className="size-4.5 shrink-0" />
                <Link
                  href={`/nauczyciele/${booking.teacher.slug}`}
                  className="font-semibold text-front-ink transition-colors hover:text-front-brand"
                >
                  {booking.teacher.name}
                </Link>
                {booking.subject ? ` · ${booking.subject.name}` : ""}
                {booking.level ? ` · ${booking.level.name}` : ""}
              </li>
              <li className="flex items-center gap-2.5">
                <Clock3 className="size-4.5 shrink-0" />
                {booking.minutes} min
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4.5 shrink-0" />
                {[
                  booking.location?.name,
                  LOCATION_TYPE_LABELS[booking.mode as LocationType],
                  booking.location?.city,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </li>
            </ul>

            {booking.price !== null && CHARGEABLE.includes(status) && (
              <p className="mt-5 flex items-baseline justify-between gap-4 border-t border-front-line pt-4">
                <span className="font-semibold text-front-muted">
                  Do zapłaty po lekcji
                </span>
                <span className="font-display text-2xl font-semibold">
                  {formatPrice(booking.price, settings.currency)}
                </span>
              </p>
            )}

            {booking.studentNote && (
              <div className="mt-5 border-t border-front-line pt-4">
                <p className="font-body text-sm font-bold text-front-muted">
                  Twoja wiadomość
                </p>
                <p className="mt-1 leading-relaxed whitespace-pre-line">
                  {booking.studentNote}
                </p>
              </div>
            )}

            {booking.statusReason && status !== "PENDING" && (
              <div className="mt-5 border-t border-front-line pt-4">
                <p className="font-body text-sm font-bold text-front-muted">
                  Powód
                </p>
                <p className="mt-1 leading-relaxed">{booking.statusReason}</p>
              </div>
            )}

            <div className="mt-6 border-t border-front-line pt-5">
              {canCancel ? (
                <CancelBooking
                  reference={booking.reference}
                  deadlineLabel={formatDateTime(booking.cancelDeadline)}
                />
              ) : (
                <p className="font-body text-sm text-front-muted">
                  {status === "PENDING" || status === "CONFIRMED"
                    ? "Termin jest już za blisko, żeby odwołać go ze strony. Zadzwoń albo napisz — dogadamy to bezpośrednio."
                    : "Ta rezerwacja jest zamknięta."}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/terminy" className={btnSecondary}>
              Umów kolejną lekcję
              <ArrowRight />
            </Link>
            <p className="font-body text-sm text-front-muted">
              Zapisz ten adres — pod nim sprawdzisz status w każdej chwili.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
