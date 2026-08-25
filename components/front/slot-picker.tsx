"use client"

import { ArrowRight, CalendarDays } from "lucide-react"
import { useState } from "react"

import { btnPrimary, sampleTag } from "@/components/front/styles"
import { cn } from "@/lib/utils"

// PRZYKŁADOWY GRAFIK. Docelowo te godziny liczy `computeAvailability()` z
// `lib/availability.ts` (reguły tygodnia − wyjątki − rezerwacje − bufory − grupy),
// a cenę podaje `resolveHourlyPrice()`. Do czasu etapu 3 dane są wpisane ręcznie
// i strona mówi o tym wprost.

type Subject = {
  id: string
  name: string
  level: string
  price: number
  minutes: number
  ring: string
  chipOn: string
  chipOff: string
  days: { label: string; times: string[] }[]
}

const SUBJECTS: Subject[] = [
  {
    id: "matematyka",
    name: "Matematyka",
    level: "liceum",
    price: 100,
    minutes: 60,
    ring: "ring-front-brand",
    chipOn: "bg-front-brand text-white",
    chipOff: "bg-front-brand-soft text-front-brand hover:bg-[#e5e0ff]",
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
    price: 100,
    minutes: 60,
    ring: "ring-front-sky",
    chipOn: "bg-front-sky text-white",
    chipOff: "bg-front-sky-soft text-front-sky hover:bg-[#d5eaff]",
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
    price: 120,
    minutes: 90,
    ring: "ring-front-mint",
    chipOn: "bg-front-mint text-white",
    chipOff: "bg-front-mint-soft text-front-mint hover:bg-[#cff2e8]",
    days: [
      { label: "pon.", times: ["17:00"] },
      { label: "wt.", times: [] },
      { label: "śr.", times: ["16:30", "19:00"] },
      { label: "czw.", times: ["18:00"] },
      { label: "pt.", times: ["16:00", "19:30"] },
    ],
  },
]

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

  return (
    <div className="rounded-[28px] border border-front-line bg-front-surface p-5 shadow-[0_30px_60px_-32px_rgba(26,24,48,0.5)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-front-brand-soft text-front-brand">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <p className="font-display text-lg leading-tight font-semibold text-front-ink">
              Wolne terminy
            </p>
            <p className="font-body text-sm text-front-muted">ten tydzień</p>
          </div>
        </div>
        <span className={sampleTag}>przykład</span>
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
                "rounded-full px-4 py-2 font-body text-sm font-bold transition-colors duration-150",
                active ? item.chipOn : item.chipOff
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
              onClick={() => pickDay(index)}
              className={cn(
                "rounded-xl border-2 py-2 font-body text-sm font-bold transition-colors duration-150",
                active
                  ? "border-front-ink bg-front-ink text-white"
                  : "border-front-line bg-front-surface text-front-ink hover:border-[#d6d2ee]",
                empty &&
                  "cursor-not-allowed border-transparent bg-front-ground text-[#a5a2c0] line-through"
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
                  ? cn("bg-front-ink text-white ring-2 ring-offset-2", subject.ring)
                  : "bg-front-ground text-front-ink hover:bg-[#f0edfd]"
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
          <p className="font-display text-2xl leading-tight font-semibold text-front-ink">
            {day.label} {selectedTime}
          </p>
        </div>
        <p className="text-right">
          <span className="font-display text-3xl leading-none font-semibold text-front-ink">
            {subject.price} zł
          </span>
        </p>
      </div>

      <a href="#kontakt" className={cn(btnPrimary, "mt-4 w-full")}>
        Zajmij tę godzinę
        <ArrowRight />
      </a>
    </div>
  )
}
