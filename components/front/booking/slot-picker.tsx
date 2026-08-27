"use client"

import { ArrowRight, CalendarDays, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { btnPrimary } from "@/components/front/styles"
import { SUBJECT_TONES } from "@/components/front/subject-tone"
import { formatPrice, plural } from "@/lib/format"
import { lessonPrice } from "@/lib/pricing"
import type { BoardSlot, SlotBoard } from "@/lib/public/slot-board"
import { priceKey } from "@/lib/public/slot-board"
import { cn } from "@/lib/utils"

/**
 * Wybór terminu — komponent sygnaturowy strony (`DESIGN.md`, Slot Picker).
 *
 * Model interakcji: **przedmiot → dzień → godzina**. Nauczyciel jest wynikiem,
 * nie kolejnym pytaniem — na kafelku godziny widać, u kogo jest wolne.
 * Poziom siedzi w podsumowaniu, bo od niego zależy cena, a nie dostępność.
 *
 * Cały grafik przychodzi z serwera jednym kawałkiem (`getSlotBoard()`), więc
 * zmiana przedmiotu nie kosztuje round-tripu — a godziny i tak są policzone
 * przy tym żądaniu, nie wyjęte z cache'a.
 */

export type PickerSubject = { id: string; name: string; slug: string }
export type PickerLevel = { id: string; name: string; slug: string }

export function SlotPicker({
  board,
  subjects,
  levels,
  currency = "PLN",
  initialSubjectId,
  initialLevelId,
  showLevels = true,
  note,
}: {
  board: SlotBoard
  subjects: PickerSubject[]
  levels: PickerLevel[]
  currency?: string
  initialSubjectId?: string | null
  initialLevelId?: string | null
  showLevels?: boolean
  /** Zdanie pod kartą; domyślnie tłumaczy, skąd biorą się godziny. */
  note?: string
}) {
  const [subjectId, setSubjectId] = useState(
    initialSubjectId ?? subjects[0]?.id ?? ""
  )
  const [levelId, setLevelId] = useState<string | null>(initialLevelId ?? null)
  const [chosenDay, setChosenDay] = useState<string | null>(null)
  const [chosenSlot, setChosenSlot] = useState<string | null>(null)

  const subject = subjects.find((item) => item.id === subjectId) ?? subjects[0]
  const level = levels.find((item) => item.id === levelId) ?? null
  const tone = SUBJECT_TONES[subjects.indexOf(subject) % SUBJECT_TONES.length]

  const teachers = new Map(board.teachers.map((item) => [item.id, item]))

  // Nauczyciel wchodzi do wyników, jeśli uczy tego przedmiotu — a przy wskazanym
  // poziomie także tego poziomu. Filtr po stronie klienta, bo dane są już tutaj.
  const visible = board.slots.filter((slot) => {
    const teacher = teachers.get(slot.teacherId)
    if (!teacher || !subject) return false
    const link = teacher.subjects.find((item) => item.subjectId === subject.id)
    if (!link) return false
    if (levelId && !link.levelIds.includes(levelId)) return false
    return true
  })

  const byDay = new Map<string, BoardSlot[]>()
  for (const slot of visible) {
    const list = byDay.get(slot.dayKey)
    if (list) list.push(slot)
    else byDay.set(slot.dayKey, [slot])
  }

  const firstDayWithSlots =
    board.days.find((day) => (byDay.get(day.key)?.length ?? 0) > 0)?.key ?? null
  const activeDay =
    chosenDay && byDay.has(chosenDay) ? chosenDay : firstDayWithSlots

  const daySlots = activeDay ? (byDay.get(activeDay) ?? []) : []
  const activeSlot =
    daySlots.find((slot) => slot.id === chosenSlot) ?? daySlots[0] ?? null

  const teacher = activeSlot ? teachers.get(activeSlot.teacherId) : null
  const hourly = activeSlot
    ? (board.prices[priceKey(subject?.id, levelId, activeSlot.teacherId)] ??
      board.prices[priceKey(subject?.id, null, activeSlot.teacherId)] ??
      null)
    : null
  const total =
    hourly !== null && activeSlot ? lessonPrice(hourly, activeSlot.minutes) : null

  const dayLabel = board.days.find((day) => day.key === activeDay)

  const bookingHref = activeSlot
    ? `/rezerwacja?${new URLSearchParams({
        termin: activeSlot.startsAt,
        nauczyciel: teacher?.slug ?? "",
        przedmiot: subject?.slug ?? "",
        ...(level ? { poziom: level.slug } : {}),
      }).toString()}`
    : "/terminy"

  // Poziomy zawężamy do tych, których ktokolwiek uczy w wybranym przedmiocie —
  // pusta lista godzin po wyborze poziomu bez nauczyciela to ślepa uliczka.
  const subjectLevelIds = new Set(
    board.teachers.flatMap(
      (item) =>
        item.subjects.find((link) => link.subjectId === subject?.id)?.levelIds ??
        []
    )
  )
  const usableLevels = levels.filter((item) => subjectLevelIds.has(item.id))

  return (
    <div className="rounded-[28px] border border-front-line bg-front-surface p-5 shadow-[0_30px_60px_-32px_color-mix(in_oklch,var(--front-ink),transparent_55%)] sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-front-brand-soft text-front-brand">
          <CalendarDays className="size-5" />
        </span>
        <div>
          <p className="font-display text-lg leading-tight font-semibold">
            Wolne terminy
          </p>
          <p className="font-body text-sm text-front-muted">
            {visible.length > 0
              ? `${visible.length} ${plural(visible.length, "godzina", "godziny", "godzin")} w najbliższych ${board.days.length} dniach`
              : "najbliższe dni"}
          </p>
        </div>
      </div>

      {subjects.length > 1 && (
        <div
          role="group"
          aria-label="Przedmiot"
          className="mt-5 flex flex-wrap gap-2"
        >
          {subjects.map((item, index) => {
            const itemTone = SUBJECT_TONES[index % SUBJECT_TONES.length]
            const active = item.id === subject?.id
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSubjectId(item.id)
                  setChosenDay(null)
                  setChosenSlot(null)
                }}
                className={cn(
                  "min-h-11 rounded-full px-4 py-2 font-body text-sm font-bold transition-[background-color,color,box-shadow] duration-150",
                  active
                    ? cn(
                        "bg-front-ink text-front-surface ring-2 ring-offset-2 ring-offset-front-surface",
                        itemTone.ring
                      )
                    : cn(itemTone.soft, "hover:brightness-[0.97]")
                )}
              >
                {item.name}
              </button>
            )
          })}
        </div>
      )}

      {showLevels && usableLevels.length > 1 && (
        <div
          role="group"
          aria-label="Poziom"
          className="mt-3 flex flex-wrap gap-1.5"
        >
          <button
            type="button"
            aria-pressed={levelId === null}
            onClick={() => {
              setLevelId(null)
              setChosenSlot(null)
            }}
            className={cn(
              "min-h-9 rounded-full px-3 py-1.5 font-body text-sm font-semibold transition-colors duration-150",
              levelId === null
                ? "bg-front-ink text-front-surface"
                : "bg-front-ground text-front-muted hover:text-front-ink"
            )}
          >
            każdy poziom
          </button>
          {usableLevels.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={levelId === item.id}
              onClick={() => {
                setLevelId(item.id)
                setChosenDay(null)
                setChosenSlot(null)
              }}
              className={cn(
                "min-h-9 rounded-full px-3 py-1.5 font-body text-sm font-semibold transition-colors duration-150",
                levelId === item.id
                  ? "bg-front-ink text-front-surface"
                  : "bg-front-ground text-front-muted hover:text-front-ink"
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      <div
        role="group"
        aria-label="Dzień"
        className={cn(
          "mt-4 grid gap-1.5",
          board.days.length > 7 ? "grid-cols-7" : "grid-cols-5"
        )}
      >
        {board.days.map((day) => {
          const count = byDay.get(day.key)?.length ?? 0
          const empty = count === 0
          const active = day.key === activeDay
          return (
            <button
              key={day.key}
              type="button"
              aria-pressed={active}
              disabled={empty}
              aria-disabled={empty}
              title={empty ? "Brak wolnych godzin tego dnia" : undefined}
              onClick={() => {
                setChosenDay(day.key)
                setChosenSlot(null)
              }}
              className={cn(
                "min-h-11 rounded-xl border-2 px-1 py-1.5 font-body text-sm font-bold transition-colors duration-150",
                active
                  ? "border-front-ink bg-front-ink text-front-surface"
                  : "border-front-line bg-front-surface text-front-ink hover:border-front-line-strong",
                empty &&
                  "cursor-not-allowed border-transparent bg-front-ground text-front-muted/60 line-through"
              )}
            >
              <span className="block leading-tight">{day.weekday}</span>
              <span className="block text-xs leading-tight font-semibold opacity-80 tabular-nums">
                {day.dayNumber} {day.month}
              </span>
            </button>
          )
        })}
      </div>

      {daySlots.length > 0 ? (
        <div
          key={`${subject?.id}-${levelId ?? "all"}-${activeDay}`}
          role="group"
          aria-label="Godzina"
          className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4"
        >
          {daySlots.map((slot, index) => {
            const active = slot.id === activeSlot?.id
            const slotTeacher = teachers.get(slot.teacherId)
            return (
              <button
                key={slot.id}
                type="button"
                aria-pressed={active}
                data-slot-in
                style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
                onClick={() => setChosenSlot(slot.id)}
                className={cn(
                  "min-h-11 rounded-xl px-1 py-2 font-body text-sm font-bold tabular-nums transition-colors duration-150",
                  active
                    ? cn(
                        "bg-front-ink text-front-surface ring-2 ring-offset-2 ring-offset-front-surface",
                        tone.ring
                      )
                    : "bg-front-ground text-front-ink hover:bg-front-brand-soft"
                )}
              >
                <span className="block leading-tight">{slot.time}</span>
                {slotTeacher && (
                  <span className="block truncate text-xs leading-tight font-semibold opacity-75">
                    {slotTeacher.name.split(" ")[0]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-front-ground p-5 text-center">
          <p className="font-display text-lg font-semibold">
            Nic wolnego w tym przedmiocie
          </p>
          <p className="mx-auto mt-1 max-w-[36ch] font-body text-sm leading-relaxed text-front-muted">
            Zmień przedmiot albo poziom, zajrzyj na pełną listę terminów, albo
            napisz do nas — dopasujemy godzinę poza grafikiem.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/terminy"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-front-ink px-4 font-body text-sm font-bold text-front-surface"
            >
              Wszystkie terminy
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={`/kontakt${subject ? `?przedmiot=${subject.slug}` : ""}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-front-surface px-4 font-body text-sm font-bold text-front-ink"
            >
              <MessageCircle className="size-4" />
              Napisz do nas
            </Link>
          </div>
        </div>
      )}

      {activeSlot && (
        <>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-front-line pt-4">
            <div className="min-w-0">
              <p className="truncate font-body text-sm text-front-muted">
                {subject?.name}
                {level ? ` · ${level.name}` : ""} · {activeSlot.minutes} min
                {teacher ? ` · ${teacher.name}` : ""}
              </p>
              <p className="font-display text-2xl leading-tight font-semibold">
                {dayLabel?.weekday} {dayLabel?.dayNumber} {dayLabel?.month},{" "}
                {activeSlot.time}
              </p>
            </div>
            <p className="shrink-0 text-right">
              <span className="font-display text-3xl leading-none font-semibold">
                {total === null ? "—" : formatPrice(total, currency)}
              </span>
              <span className="mt-1 block font-body text-sm text-front-muted">
                {hourly === null
                  ? "cena do ustalenia"
                  : `${formatPrice(hourly, currency)}/h`}
              </span>
            </p>
          </div>

          <Link href={bookingHref} className={cn(btnPrimary, "mt-4 w-full")}>
            Zajmij {dayLabel?.weekday} {activeSlot.time}
            <ArrowRight />
          </Link>
        </>
      )}

      <p className="mt-3 text-center font-body text-xs text-front-muted">
        {note ??
          "Godziny liczymy przy każdym wejściu — to, co widzisz, jest naprawdę wolne."}
      </p>
    </div>
  )
}
