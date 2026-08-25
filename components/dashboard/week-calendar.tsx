import { Plus } from "lucide-react"
import Link from "next/link"

import { dayRange, layoutDayEvents } from "@/lib/calendar-layout"
import { formatTime } from "@/lib/format"
import { BOOKING_STATUS_LABELS } from "@/lib/labels"
import type {
  CalendarBooking,
  CalendarFreeSlot,
  CalendarGroupMeeting,
} from "@/lib/queries/calendar"
import { cn } from "@/lib/utils"

/** Ile pikseli na minutę — 0.8 daje czytelną dobę bez przewijania w pionie. */
const PX_PER_MIN = 0.8
const DEFAULT_START = 8 * 60
const DEFAULT_END = 21 * 60
/** Najniższy czytelny kafelek — krótsza lekcja i tak dostanie tyle miejsca. */
const MIN_EVENT_PX = 22
/** Odstęp kafelka od krawędzi toru (odpowiednik dawnych `left-1 right-1`). */
const EVENT_GAP_REM = 0.25

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

/** Kafelki, które dzielą kolumnę dnia i muszą się między sobą ułożyć. */
type DayEvent =
  | ({ kind: "group" } & CalendarGroupMeeting)
  | ({ kind: "booking" } & CalendarBooking)

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
  groupMeetings,
  showTeacher,
  slotHref,
}: {
  weekStart: Date
  bookings: CalendarBooking[]
  freeSlots: CalendarFreeSlot[]
  groupMeetings: CalendarGroupMeeting[]
  /** Widok „wszyscy nauczyciele" — wtedy na kafelku pokazujemy, czyja to lekcja. */
  showTeacher?: boolean
  /**
   * Gdy podane, wolne okienko staje się skrótem do zapisania lekcji o tej porze.
   * Bez tego (widok wszystkich nauczycieli) zostaje samym tłem.
   */
  slotHref?: (slot: CalendarFreeSlot) => string
}) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + index)
    return date
  })

  // Siatka rozciąga się tylko tyle, ile trzeba, ale nie węziej niż 8:00–21:00.
  const marks = [...bookings, ...groupMeetings, ...freeSlots].flatMap(
    (item) => {
      const { startMin, endMin } = dayRange(item)
      return [startMin, endMin]
    }
  )
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
            const daySlots = freeSlots.filter((s) => sameDay(s.startsAt, day))
            const isToday = sameDay(day, today)
            // Grupy i lekcje dzielą tę samą kolumnę, więc tory liczymy dla nich
            // razem — inaczej lekcja w godzinach grupy zasłoniłaby spotkanie.
            const events = layoutDayEvents<DayEvent>([
              ...groupMeetings
                .filter((meeting) => sameDay(meeting.startsAt, day))
                .map((meeting) => ({ kind: "group" as const, ...meeting })),
              ...bookings
                .filter((booking) => sameDay(booking.startsAt, day))
                .map((booking) => ({ kind: "booking" as const, ...booking })),
            ])

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-l border-border/60",
                  isToday && "bg-primary/5"
                )}
              >
                {daySlots.map((slot) => {
                  const { startMin, endMin } = dayRange(slot)
                  const style = {
                    top: (startMin - gridStart) * PX_PER_MIN,
                    height: (endMin - startMin) * PX_PER_MIN,
                  }
                  const label = `${formatTime(slot.startsAt)}–${formatTime(slot.endsAt)}`
                  const key = `slot-${slot.startsAt.toISOString()}`
                  const base =
                    "absolute right-1 left-1 rounded-md border border-dashed border-border bg-card/40"

                  if (!slotHref) {
                    return (
                      <div
                        key={key}
                        className={base}
                        style={style}
                        title={`Wolne: ${label}`}
                      />
                    )
                  }

                  return (
                    <Link
                      key={key}
                      href={slotHref(slot)}
                      className={cn(
                        base,
                        "group flex items-center justify-center transition-colors hover:border-primary/60 hover:bg-primary/10"
                      )}
                      style={style}
                      title={`Zapisz lekcję: ${label}`}
                    >
                      <Plus className="size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  )
                })}

                {events.map(({ item, startMin, endMin, lane, lanes }) => {
                  const position = {
                    top: (startMin - gridStart) * PX_PER_MIN,
                    height: Math.max(
                      (endMin - startMin) * PX_PER_MIN,
                      MIN_EVENT_PX
                    ),
                    // Nachodzące na siebie kafelki dzielą szerokość kolumny po równo.
                    left: `calc(${(lane * 100) / lanes}% + ${EVENT_GAP_REM}rem)`,
                    width: `calc(${100 / lanes}% - ${2 * EVENT_GAP_REM}rem)`,
                  }
                  const box = cn(
                    "absolute overflow-hidden rounded-md border py-1",
                    lanes > 1 ? "px-1" : "px-1.5"
                  )
                  // Na wąskim torze godzina zjadłaby całą linijkę — zostaje
                  // pozycja w siatce i podpowiedź pod kursorem.
                  const time =
                    lanes === 1 ? `${formatTime(item.startsAt)} ` : ""

                  if (item.kind === "group") {
                    return (
                      <div
                        key={`group-${item.id}-${item.startsAt.toISOString()}`}
                        className={cn(
                          box,
                          "border-violet-500/40 bg-violet-500/15 text-violet-800 dark:text-violet-200"
                        )}
                        style={position}
                        title={`${formatTime(item.startsAt)}–${formatTime(item.endsAt)} · ${item.name} · ${item.seats}/${item.maxSeats} miejsc`}
                      >
                        <p className="truncate text-[11px] leading-tight font-semibold">
                          {time}
                          {item.name}
                        </p>
                        <p className="truncate text-[10px] leading-tight opacity-80">
                          grupa · {item.seats}/{item.maxSeats}
                          {showTeacher && ` · ${item.teacherName}`}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={`booking-${item.id}`}
                      href={`/dashboard/rezerwacje/${item.id}`}
                      className={cn(
                        box,
                        "transition-shadow hover:shadow-sm",
                        STATUS_STYLES[item.status]
                      )}
                      style={position}
                      title={`${formatTime(item.startsAt)}–${formatTime(item.endsAt)} · ${item.studentName} · ${BOOKING_STATUS_LABELS[item.status]}`}
                    >
                      <p className="truncate text-[11px] leading-tight font-semibold">
                        {time}
                        {item.studentName}
                      </p>
                      <p className="truncate text-[10px] leading-tight opacity-80">
                        {showTeacher
                          ? item.teacherName
                          : (item.subjectName ?? "bez przedmiotu")}
                      </p>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CalendarLegend({
  showFree,
  showGroups,
}: {
  showFree: boolean
  showGroups: boolean
}) {
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
      {showGroups && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-3 rounded border border-violet-500/40 bg-violet-500/15" />
          Zajęcia grupowe
        </span>
      )}
      {showFree && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-3 rounded border border-dashed border-border bg-card/40" />
          Wolne okienko
        </span>
      )}
    </div>
  )
}
