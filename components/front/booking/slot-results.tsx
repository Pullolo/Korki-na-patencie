import { CalendarDays } from "lucide-react"
import Link from "next/link"

import { cardBase } from "@/components/front/styles"
import { formatPrice, plural } from "@/lib/format"
import type { BoardSlot, SlotBoard } from "@/lib/public/slot-board"
import { priceKey, slotsByDay, teacherTeaches } from "@/lib/public/slot-board"
import { cn } from "@/lib/utils"

/**
 * Wyniki wyszukiwania terminów: dzień po dniu, w każdym dniu godziny
 * pogrupowane po nauczycielu.
 *
 * Każda godzina jest linkiem prosto do rezerwacji z kompletem parametrów —
 * od wejścia na stronę do formularza są dwa kliknięcia, a wynik da się wysłać
 * komuś innemu.
 */
export function SlotResults({
  board,
  subjectSlug,
  subjectId,
  levelSlug,
  levelId,
  currency,
}: {
  board: SlotBoard
  subjectSlug: string | null
  subjectId: string | null
  levelSlug: string | null
  levelId: string | null
  currency: string
}) {
  const teachers = new Map(board.teachers.map((item) => [item.id, item]))
  const visible = board.slots.filter((slot) =>
    teacherTeaches(teachers.get(slot.teacherId), subjectId, levelId)
  )
  const byDay = slotsByDay(visible)

  function hourlyFor(slot: BoardSlot) {
    const teacher = teachers.get(slot.teacherId)
    if (!teacher) return null

    if (subjectId) {
      return (
        board.prices[priceKey(subjectId, levelId, slot.teacherId)] ??
        board.prices[priceKey(subjectId, null, slot.teacherId)] ??
        null
      )
    }

    // Bez wybranego przedmiotu pokazujemy najniższą stawkę tego nauczyciela.
    const prices = teacher.subjects
      .map(
        (link) =>
          board.prices[priceKey(link.subjectId, levelId, slot.teacherId)] ??
          board.prices[priceKey(link.subjectId, null, slot.teacherId)]
      )
      .filter((price): price is number => typeof price === "number")
    return prices.length > 0 ? Math.min(...prices) : null
  }

  function bookingHref(slot: BoardSlot) {
    const teacher = teachers.get(slot.teacherId)
    const query = new URLSearchParams({
      termin: slot.startsAt,
      nauczyciel: teacher?.slug ?? "",
    })
    if (subjectSlug) query.set("przedmiot", subjectSlug)
    if (levelSlug) query.set("poziom", levelSlug)
    return `/rezerwacja?${query.toString()}`
  }

  const daysWithSlots = board.days.filter(
    (day) => (byDay.get(day.key)?.length ?? 0) > 0
  )

  if (daysWithSlots.length === 0) return null

  return (
    <div className="grid gap-4">
      {daysWithSlots.map((day) => {
        const slots = byDay.get(day.key) ?? []
        const groups = new Map<string, BoardSlot[]>()
        for (const slot of slots) {
          const list = groups.get(slot.teacherId)
          if (list) list.push(slot)
          else groups.set(slot.teacherId, [slot])
        }

        return (
          <section key={day.key} className={cn(cardBase, "p-5 sm:p-6")}>
            <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-xl font-semibold">
                {day.isToday ? "Dziś" : day.weekday}{" "}
                <span className="tabular-nums">
                  {day.dayNumber} {day.month}
                </span>
              </span>
              <span className="font-body text-sm font-semibold text-front-muted">
                {slots.length}{" "}
                {plural(slots.length, "godzina", "godziny", "godzin")}
              </span>
            </h3>

            <div className="mt-4 grid gap-4">
              {[...groups.entries()].map(([teacherId, teacherSlots]) => {
                const teacher = teachers.get(teacherId)
                const hourly = hourlyFor(teacherSlots[0])
                return (
                  <div key={teacherId}>
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <Link
                        href={`/nauczyciele/${teacher?.slug ?? ""}`}
                        className="font-semibold transition-colors hover:text-front-brand"
                      >
                        {teacher?.name}
                      </Link>
                      {hourly !== null && (
                        <span className="font-body text-sm font-semibold text-front-muted">
                          od {formatPrice(hourly, currency)}/h
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {teacherSlots.map((slot) => (
                        <Link
                          key={slot.id}
                          href={bookingHref(slot)}
                          className="inline-flex min-h-11 items-center rounded-xl bg-front-ground px-4 font-body text-sm font-bold tabular-nums text-front-ink transition-colors hover:bg-front-brand-soft hover:text-front-brand"
                        >
                          {slot.time}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function SlotResultsEmpty({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn(cardBase, "p-8 text-center sm:p-12")}>
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-front-brand-soft text-front-brand">
        <CalendarDays className="size-6" />
      </span>
      {children}
    </div>
  )
}
