import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BookingDetailActions } from "@/components/dashboard/booking-detail-actions"
import { Header } from "@/components/dashboard/header"
import { InternalNote } from "@/components/dashboard/internal-note"
import { Panel } from "@/components/dashboard/panel"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ensureDashboardPage } from "@/lib/auth"
import {
  formatDateTime,
  formatLongDate,
  formatPrice,
  formatTime,
  studentLabel,
  teacherLabel,
} from "@/lib/format"
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_TONES,
  LOCATION_TYPE_LABELS,
} from "@/lib/labels"
import { getBookingDetail } from "@/lib/queries/bookings"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Rezerwacja" }

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-foreground">{children}</dd>
    </div>
  )
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await ensureDashboardPage()
  const { id } = await params

  const [booking, settings] = await Promise.all([
    getBookingDetail(ctx, id).catch(() => null),
    getSiteSettingsSafe(),
  ])

  // Nauczyciel poza swoim zasięgiem dostaje 404, nie komunikat o braku uprawnień —
  // nie ma powodu potwierdzać mu, że taka rezerwacja w ogóle istnieje.
  if (!booking) notFound()

  const isPast = booking.endsAt < new Date()

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title={`Rezerwacja ${booking.reference}`}
        subtitle={`${formatLongDate(booking.startsAt)}, ${formatTime(booking.startsAt)}–${formatTime(booking.endsAt)}`}
        backHref="/dashboard/rezerwacje"
        actions={
          <StatusBadge
            label={BOOKING_STATUS_LABELS[booking.status]}
            tone={BOOKING_STATUS_TONES[booking.status]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Zajęcia">
            <dl className="divide-y divide-border">
              <Row label="Termin">
                {formatLongDate(booking.startsAt)},{" "}
                {formatTime(booking.startsAt)}–{formatTime(booking.endsAt)}
              </Row>
              <Row label="Przedmiot">{booking.subject?.name ?? "—"}</Row>
              <Row label="Poziom">{booking.level?.name ?? "—"}</Row>
              <Row label="Tryb">{LOCATION_TYPE_LABELS[booking.mode]}</Row>
              <Row label="Miejsce">
                {booking.location ? (
                  <span>
                    {booking.location.name}
                    {booking.location.address && (
                      <span className="block text-xs text-muted-foreground">
                        {booking.location.address}
                        {booking.location.city && `, ${booking.location.city}`}
                      </span>
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Cena">
                {formatPrice(booking.price, settings.currency)}
              </Row>
              <Row label="Nauczyciel">
                {teacherLabel(booking.teacherProfile)}
              </Row>
            </dl>
          </Panel>

          <Panel title="Uczeń">
            <dl className="divide-y divide-border">
              <Row label="Imię i nazwisko">{studentLabel(booking)}</Row>
              <Row label="E-mail">
                {booking.student?.email ?? booking.guestEmail ?? "—"}
              </Row>
              <Row label="Telefon">
                {booking.student?.phone ?? booking.guestPhone ?? "—"}
              </Row>
              <Row label="Konto">
                {booking.student ? "zarejestrowany" : "rezerwacja gościa"}
              </Row>
            </dl>

            {booking.studentNote && (
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                  Wiadomość od ucznia
                </p>
                <p className="text-sm text-foreground">{booking.studentNote}</p>
              </div>
            )}
          </Panel>

          <Panel
            title="Notatka wewnętrzna"
            description="Widoczna tylko w panelu"
          >
            <InternalNote bookingId={booking.id} note={booking.internalNote} />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Co dalej">
            <BookingDetailActions
              bookingId={booking.id}
              status={booking.status}
              isPast={isPast}
            />
          </Panel>

          <Panel title="Historia">
            <dl className="divide-y divide-border">
              <Row label="Zgłoszona">{formatDateTime(booking.createdAt)}</Row>
              {booking.confirmedAt && (
                <Row label="Potwierdzona">
                  {formatDateTime(booking.confirmedAt)}
                </Row>
              )}
              {booking.cancelledAt && (
                <Row label="Odwołana">
                  {formatDateTime(booking.cancelledAt)}
                </Row>
              )}
              <Row label="Ostatnia zmiana">
                {formatDateTime(booking.updatedAt)}
              </Row>
            </dl>

            {booking.statusReason && (
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                  Powód
                </p>
                <p className="text-sm text-foreground">
                  {booking.statusReason}
                </p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
