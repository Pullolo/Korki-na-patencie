"use client"

import { ArrowRight, CalendarDays } from "lucide-react"
import { useState } from "react"

import { btnPrimary } from "@/components/front/styles"
import { cn } from "@/lib/utils"

// PRZYKŁADOWY GRAFIK. Docelowo te godziny liczy `computeAvailability()` z
// `lib/availability.ts` (reguły tygodnia − wyjątki − rezerwacje − bufory − grupy),
// a cenę podaje `resolveHourlyPrice()`. Do czasu etapu 3 dane są wpisane ręcznie
// i strona mówi o tym wprost.

type Subject = {
  id: string
  name: string
  level: string
  /** Stawka godzinowa z cennika — cena spotkania liczy się z niej i z długości. */
  rate: number
  minutes: number
  ring: string
  soft: string
  days: { label: string; times: string[] }[]
}

const SUBJECTS: Subject[] = [
  {
    id: "matematyka",
    name: "Matematyka",
    level: "liceum",
    rate: 100,
    minutes: 60,
    ring: "ring-front-brand",
    soft: "bg-front-brand-soft text-front-brand",
    days: [
      { label: "pon.", times: ["16:00", "17:30", "19:00"] },
      { label: "wt.", times: ["15:00", "18:00"] },
      { label: "śr.", times: ["16:00", "17:00", "18:30", "20:00"] },
      { label: "czw.", times: ["17:00"] },
      { label: "pt.", times: ["15:30", "17:00", "18:30"] },
    ],
  },
  {
    id: "fizyka",
    name: "Fizyka",
    level: "liceum",
    rate: 100,
    minutes: 60,
    ring: "ring-front-sky",
    soft: "bg-front-sky-soft text-front-sky",
    days: [
      { label: "pon.", times: ["18:00"] },
      { label: "wt.", times: ["16:00", "17:30"] },
      { label: "śr.", times: [] },
      { label: "czw.", times: ["15:00", "16:30", "19:00"] },
      { label: "pt.", times: ["17:00", "18:30"] },
    ],
  },
  {
    id: "informatyka",
    name: "Informatyka",
    level: "matura",
    rate: 120,
    minutes: 90,
    ring: "ring-front-mint",
    soft: "bg-front-mint-soft text-front-mint",
    days: [
      { label: "pon.", times: ["17:00"] },
      { label: "wt.", times: [] },
      { label: "śr.", times: ["16:30", "19:00"] },
      { label: "czw.", times: ["18:00"] },
      { label: "pt.", times: ["16:00", "19:30"] },
    ],
  },
]

function lessonPrice(subject: Subject) {
  return Math.round((subject.rate * subject.minutes) / 60)
}

function firstDayWithTimes(subject: Subject) {
  const index = subject.days.findIndex((day) => day.times.length > 0)
  return index === -1 ? 0 : index
}

export function SlotPicker() {
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id)
  const subject = SUBJECTS.find((item) => item.id === subjectId) ?? SUBJECTS[0]

  const [dayIndex, setDayIndex] = useState(() => firstDayWithTimes(SUBJECTS[0]))
  const day = subject.days[dayIndex] ?? subject.days[0]

  const [time, setTime] = useState(() => SUBJECTS[0].days[0].times[0])
  const selectedTime = day.times.includes(time) ? time : day.times[0]

  function pickSubject(next: Subject) {
    setSubjectId(next.id)
    const nextDay = firstDayWithTimes(next)
    setDayIndex(nextDay)
    setTime(next.days[nextDay].times[0] ?? "")
  }

  function pickDay(index: number) {
    setDayIndex(index)
    setTime(subject.days[index].times[0] ?? "")
  }

  const price = lessonPrice(subject)
  const slot = `${subject.name} (${subject.level}), ${day.label} ${selectedTime}`

  // Wybrany termin musi przeżyć kliknięcie — inaczej cała ta karta jest ozdobą.
  // Docelowo pójdzie do rezerwacji w bazie; na razie wypełnia wiadomość.
  const bookHref = `mailto:kontakt@korkinapatencie.pl?subject=${encodeURIComponent(
    `Rezerwacja: ${slot}`
  )}&body=${encodeURIComponent(
    `Dzień dobry,

chcę zająć termin: ${slot}, ${subject.minutes} min — ${price} zł.

`
  )}`

  return (
    <div className="relative">
      {/* Naklejka — jedyny obrócony element na stronie, więc czyta się jak
          naklejka, a nie jak przypadek. */}
      <span className="absolute -top-4 -right-1 z-10 rotate-[7deg] rounded-2xl bg-front-sun-soft px-3.5 py-2 font-display text-sm leading-tight font-semibold text-front-sun shadow-[0_10px_20px_-14px_color-mix(in_oklch,var(--front-ink),transparent_40%)] ring-1 ring-front-sun/40 sm:text-base">
        pierwsza lekcja
        <br className="sm:hidden" /> bez zobowiązań
      </span>

      <div className="rounded-[28px] border border-front-line bg-front-surface p-5 shadow-[0_30px_60px_-32px_color-mix(in_oklch,var(--front-ink),transparent_55%)] sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-front-brand-soft text-front-brand">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <p className="font-display text-lg leading-tight font-semibold">
              Wolne terminy
            </p>
            <p className="font-body text-sm text-front-muted">ten tydzień</p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Przedmiot"
          className="mt-5 flex flex-wrap gap-2"
        >
          {SUBJECTS.map((item) => {
            const active = item.id === subject.id
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => pickSubject(item)}
                className={cn(
                  "rounded-full px-4 py-2 font-body text-sm font-bold transition-[background-color,color,box-shadow] duration-150",
                  active
                    ? cn(
                        "bg-front-ink text-front-surface ring-2 ring-offset-2 ring-offset-front-surface",
                        item.ring
                      )
                    : cn(item.soft, "hover:brightness-[0.97]")
                )}
              >
                {item.name}
              </button>
            )
          })}
        </div>

        <div
          role="group"
          aria-label="Dzień tygodnia"
          className="mt-4 grid grid-cols-5 gap-1.5"
        >
          {subject.days.map((item, index) => {
            const active = index === dayIndex
            const empty = item.times.length === 0
            return (
              <button
                key={item.label}
                type="button"
                aria-pressed={active}
                disabled={empty}
                title={empty ? "Brak wolnych godzin" : undefined}
                onClick={() => pickDay(index)}
                className={cn(
                  "rounded-xl border-2 py-2 font-body text-sm font-bold transition-colors duration-150",
                  active
                    ? "border-front-ink bg-front-ink text-front-surface"
                    : "border-front-line bg-front-surface text-front-ink hover:border-front-line-strong",
                  empty &&
                    "cursor-not-allowed border-transparent bg-front-ground text-front-muted/60 line-through"
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div
          key={`${subject.id}-${day.label}`}
          role="group"
          aria-label="Godzina"
          className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4"
        >
          {day.times.map((item, index) => {
            const active = item === selectedTime
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                data-slot-in
                style={{ animationDelay: `${index * 45}ms` }}
                onClick={() => setTime(item)}
                className={cn(
                  "rounded-xl py-2.5 font-body text-sm font-bold tabular-nums transition-colors duration-150",
                  active
                    ? cn(
                        "bg-front-ink text-front-surface ring-2 ring-offset-2 ring-offset-front-surface",
                        subject.ring
                      )
                    : "bg-front-ground text-front-ink hover:bg-front-brand-soft"
                )}
              >
                {item}
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-front-line pt-4">
          <div>
            <p className="font-body text-sm text-front-muted">
              {subject.name} · {subject.level} · {subject.minutes} min
            </p>
            <p className="font-display text-2xl leading-tight font-semibold">
              {day.label} {selectedTime}
            </p>
          </div>
          <p className="text-right">
            <span className="font-display text-3xl leading-none font-semibold">
              {price} zł
            </span>
            <span className="mt-1 block font-body text-sm text-front-muted">
              {subject.rate} zł/h
            </span>
          </p>
        </div>

        <a href={bookHref} className={cn(btnPrimary, "mt-4 w-full")}>
          Zajmij {day.label} {selectedTime}
          <ArrowRight />
        </a>

        <p className="mt-3 text-center font-body text-xs text-front-muted">
          Godziny są przykładowe — prawdziwy grafik wchodzi z panelu nauczyciela.
        </p>
      </div>
    </div>
  )
}
