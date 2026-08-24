import Link from "next/link"

import type { CalendarBooking, CalendarFreeSlot } from "@/lib/queries/calendar"
import { formatTime } from "@/lib/format"
import { BOOKING_STATUS_LABELS } from "@/lib/labels"
import { cn } from "@/lib/utils"

/** Ile pikseli na minutę — 0.8 daje czytelną dobę bez przewijania w pionie. */
const PX_PER_MIN = 0.8
const DEFAULT_START = 8 * 60
const DEFAULT_END = 21 * 60

const STATUS_STYLES: Record<CalendarBooking["status"], string> = {
  PENDING:
    "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200",
  CONFIRMED:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  COMPLETED:
    "border-blue-500/40 bg-blue-500/15 text-blue-800 dark:text-blue-200",
  NO_SHOW: "border-destructive/40 bg-destructive/10 text-destructive",
  REJECTED: "border-border bg-muted text-muted-foreground",
  CANCELLED: "border-border bg-muted text-muted-foreground",
}

function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function WeekCalendar({
  weekStart,
  bookings,
  freeSlots,
  showTeacher,
}: {
  weekStart: Date
  bookings: CalendarBooking[]
  freeSlots: CalendarFreeSlot[]
  /** Widok „wszyscy nauczyciele" — wtedy na kafelku pokazujemy, czyja to lekcja. */
  showTeacher?: boolean
}) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + index)
    return date
  })

  // Siatka rozciąga się tylko tyle, ile trzeba, ale nie węziej niż 8:00–21:00.
  const marks = [
    ...bookings.flatMap((b) => [
      minutesOfDay(b.startsAt),
      minutesOfDay(b.endsAt),
    ]),
    ...freeSlots.flatMap((s) => [
      minutesOfDay(s.startsAt),
      minutesOfDay(s.endsAt),
    ]),
  ]
  const startMin = Math.min(DEFAULT_START, ...marks.map((m) => m))
  const endMin = Math.max(DEFAULT_END, ...marks.map((m) => m))
  const gridStart = Math.floor(startMin / 60) * 60
  const gridEnd = Math.ceil(endMin / 60) * 60
  const height = (gridEnd - gridStart) * PX_PER_MIN
  const hours = Array.from(
    { length: (gridEnd - gridStart) / 60 + 1 },
    (_, index) => gridStart + index * 60
  )

  const today = new Date()

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[52rem]">
        {/* Nagłówek z dniami */}
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border">
          <div />
          {days.map((day) => {
            const isToday = sameDay(day, today)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "px-2 py-2 text-center",
                  isToday && "bg-primary/5"
                )}
              >
                <p
                  className={cn(
                    "text-[11px] tracking-wide uppercase",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {day.toLocaleDateString("pl-PL", { weekday: "short" })}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {day.getDate()}.{String(day.getMonth() + 1).padStart(2, "0")}
                </p>
              </div>
            )
          })}
        </div>

        {/* Siatka godzin */}
        <div
          className="relative grid grid-cols-[3.5rem_repeat(7,1fr)]"
          style={{ height }}
        >
          {/* Linie godzinowe rysujemy raz, pod spodem wszystkich kolumn */}
          <div className="pointer-events-none absolute inset-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-0 left-0 border-t border-border/60"
                style={{ top: (hour - gridStart) * PX_PER_MIN }}
              />
            ))}
          </div>

          {/* Godziny po lewej */}
          <div className="relative">
            {hours.slice(0, -1).map((hour) => (
              <span
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                style={{ top: (hour - gridStart) * PX_PER_MIN }}
              >
                {String(hour / 60).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {days.map((day) => {
            const dayBookings = bookings.filter((b) => sameDay(b.startsAt, day))
            const daySlots = freeSlots.filter((s) => sameDay(s.startsAt, day))
            const isToday = sameDay(day, today)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-l border-border/60",
                  isToday && "bg-primary/5"
                )}
              >
                {daySlots.map((slot) => (
                  <div
                    key={`slot-${slot.startsAt.toISOString()}`}
                    className="absolute right-1 left-1 rounded-md border border-dashed border-border bg-card/40"
                    style={{
                      top:
                        (minutesOfDay(slot.startsAt) - gridStart) * PX_PER_MIN,
                      height:
                        (minutesOfDay(slot.endsAt) -
                          minutesOfDay(slot.startsAt)) *
                        PX_PER_MIN,
                    }}
                    title={`Wolne: ${formatTime(slot.startsAt)}–${formatTime(slot.endsAt)}`}
                  />
                ))}

                {dayBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/rezerwacje/${booking.id}`}
                    className={cn(
                      "absolute right-1 left-1 overflow-hidden rounded-md border px-1.5 py-1 transition-shadow hover:shadow-sm",
                      STATUS_STYLES[booking.status]
                    )}
                    style={{
                      top:
                        (minutesOfDay(booking.startsAt) - gridStart) *
                        PX_PER_MIN,
                      height: Math.max(
                        (minutesOfDay(booking.endsAt) -
                          minutesOfDay(booking.startsAt)) *
                          PX_PER_MIN,
                        22
                      ),
                    }}
                    title={`${formatTime(booking.startsAt)}–${formatTime(booking.endsAt)} · ${booking.studentName} · ${BOOKING_STATUS_LABELS[booking.status]}`}
                  >
                    <p className="truncate text-[11px] leading-tight font-semibold">
                      {formatTime(booking.startsAt)} {booking.studentName}
                    </p>
                    <p className="truncate text-[10px] leading-tight opacity-80">
                      {showTeacher
                        ? booking.teacherName
                        : (booking.subjectName ?? "bez przedmiotu")}
                    </p>
                  </Link>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CalendarLegend({ showFree }: { showFree: boolean }) {
  const items: Array<{ label: string; className: string }> = [
    { label: "Potwierdzona", className: STATUS_STYLES.CONFIRMED },
    { label: "Oczekuje", className: STATUS_STYLES.PENDING },
    { label: "Odbyta", className: STATUS_STYLES.COMPLETED },
    { label: "Nieobecność", className: STATUS_STYLES.NO_SHOW },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span className={cn("size-3 rounded border", item.className)} />
          {item.label}
        </span>
      ))}
      {showFree && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-3 rounded border border-dashed border-border bg-card/40" />
          Wolne okienko
        </span>
      )}
    </div>
  )
}
