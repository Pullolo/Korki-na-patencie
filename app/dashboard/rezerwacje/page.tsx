import { ChevronRight, ClipboardList } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { BookingActions } from "@/components/dashboard/booking-actions"
import { CreateBooking } from "@/components/dashboard/bookings/create-booking"
import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ensureDashboardPage } from "@/lib/auth"
import {
  formatDate,
  formatPrice,
  formatTime,
  studentLabel,
  teacherLabel,
} from "@/lib/format"
import { BookingStatus } from "@/lib/generated/prisma/enums"
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_TONES,
  LOCATION_TYPE_LABELS,
} from "@/lib/labels"
import {
  getBookingCountsByStatus,
  getBookingFormOptions,
  getBookings,
} from "@/lib/queries/bookings"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Rezerwacje" }

const FILTERS = [
  { value: undefined, label: "Wszystkie" },
  ...Object.values(BookingStatus).map((status) => ({
    value: status,
    label: BOOKING_STATUS_LABELS[status],
  })),
]

function parseStatus(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined
  return value in BookingStatus ? (value as BookingStatus) : undefined
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>
}) {
  const ctx = await ensureDashboardPage()
  const status = parseStatus((await searchParams).status)

  const [bookings, counts, settings, formOptions] = await Promise.all([
    getBookings(ctx, { status }).catch(() => []),
    getBookingCountsByStatus(ctx).catch(
      () => ({}) as Partial<Record<BookingStatus, number>>
    ),
    getSiteSettingsSafe(),
    getBookingFormOptions(ctx).catch(() => null),
  ])

  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Rezerwacje"
        subtitle={
          ctx.isAdmin
            ? "Zgłoszenia wszystkich nauczycieli"
            : "Twoje zgłoszenia od uczniów"
        }
      />

      <div className="space-y-4 p-4 sm:p-6">
        {formOptions && (
          <CreateBooking options={formOptions} currency={settings.currency} />
        )}

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => {
            const isActive = status === filter.value
            const count = filter.value ? (counts[filter.value] ?? 0) : total
            return (
              <Link
                key={filter.label}
                href={
                  filter.value
                    ? `/dashboard/rezerwacje?status=${filter.value}`
                    : "/dashboard/rezerwacje"
                }
                className={
                  isActive
                    ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                }
              >
                {filter.label}
                <span className="ml-1.5 opacity-60">{count}</span>
              </Link>
            )
          })}
        </div>

        <Panel bodyClassName="p-0 sm:p-0">
          {bookings.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="size-6" />}
              title="Brak rezerwacji"
              description="Gdy uczniowie zaczną się zapisywać, ich zgłoszenia pojawią się na tej liście. Lekcję ustaloną przez telefon możesz wpisać przyciskiem „Dodaj lekcję”."
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium sm:px-5">Uczeń</th>
                    <th className="px-4 py-3 font-medium">Termin</th>
                    <th className="px-4 py-3 font-medium">Przedmiot</th>
                    {ctx.isAdmin && (
                      <th className="px-4 py-3 font-medium">Nauczyciel</th>
                    )}
                    <th className="px-4 py-3 font-medium">Cena</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium sm:px-5">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 sm:px-5">
                        <p className="font-medium text-foreground">
                          {studentLabel(booking)}
                        </p>
                        <Link
                          href={`/dashboard/rezerwacje/${booking.id}`}
                          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          {booking.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-foreground">
                          {formatDate(booking.startsAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(booking.startsAt)}–
                          {formatTime(booking.endsAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">
                          {booking.subject?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.level?.name
                            ? `${booking.level.name} · `
                            : ""}
                          {LOCATION_TYPE_LABELS[booking.mode]}
                        </p>
                      </td>
                      {ctx.isAdmin && (
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {teacherLabel(booking.teacherProfile)}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {formatPrice(booking.price, settings.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={BOOKING_STATUS_LABELS[booking.status]}
                          tone={BOOKING_STATUS_TONES[booking.status]}
                        />
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <div className="flex items-center justify-end gap-2">
                          <BookingActions
                            bookingId={booking.id}
                            status={booking.status}
                          />
                          <Link
                            href={`/dashboard/rezerwacje/${booking.id}`}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label="Szczegóły rezerwacji"
                            title="Szczegóły"
                          >
                            <ChevronRight className="size-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
