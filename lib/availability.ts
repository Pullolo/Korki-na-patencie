import { dateOnlyKey, dayKey, isoWeekday } from "@/lib/dates"
import type { ExceptionType } from "@/lib/generated/prisma/enums"

/**
 * Wolne terminy nie są trzymane w bazie — liczymy je z reguł tygodniowych,
 * wyjątków i istniejących rezerwacji. Dzięki temu zmiana grafiku nie wymaga
 * przegenerowania tysięcy rekordów, a nauczyciel widzi zawsze aktualny stan.
 *
 * Wszystkie godziny to minuty od północy w czasie lokalnym.
 */

export type AvailabilityRuleInput = {
  weekday: number
  startMin: number
  endMin: number
  locationId: string | null
  validFrom: Date | null
  validTo: Date | null
  isActive: boolean
}

export type AvailabilityExceptionInput = {
  date: Date
  type: ExceptionType
  startMin: number | null
  endMin: number | null
  locationId: string | null
}

export type BusyInterval = {
  startsAt: Date
  endsAt: Date
}

export type LessonSettings = {
  slotMinutes: number
  bufferMinutes: number
  minLeadHours: number
  maxAdvanceDays: number
}

export type Slot = {
  startsAt: Date
  endsAt: Date
  locationId: string | null
}

export type AvailabilityDay = {
  /** Lokalna północ opisywanego dnia. */
  date: Date
  slots: Slot[]
  /** Ustawione, gdy cały dzień wypada przez wyjątek typu BLOCK. */
  blockedReason?: string
}

type Window = {
  startMin: number
  endMin: number
  locationId: string | null
}

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function atMinutes(day: Date, minutes: number) {
  const result = new Date(day)
  result.setHours(0, minutes, 0, 0)
  return result
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart
}

/** Scala nachodzące na siebie okna tej samej lokalizacji. */
function mergeWindows(windows: Window[]): Window[] {
  const byLocation = new Map<string, Window[]>()
  for (const window of windows) {
    const key = window.locationId ?? ""
    byLocation.set(key, [...(byLocation.get(key) ?? []), window])
  }

  const merged: Window[] = []
  for (const group of byLocation.values()) {
    const sorted = [...group].sort((a, b) => a.startMin - b.startMin)
    for (const window of sorted) {
      const last = merged.at(-1)
      if (
        last &&
        last.locationId === window.locationId &&
        window.startMin <= last.endMin
      ) {
        last.endMin = Math.max(last.endMin, window.endMin)
      } else {
        merged.push({ ...window })
      }
    }
  }
  return merged
}

/** Wycina z okna fragment zajęty przez wyjątek BLOCK. */
function subtractRange(
  windows: Window[],
  blockStart: number,
  blockEnd: number
): Window[] {
  const result: Window[] = []
  for (const window of windows) {
    if (!overlaps(window.startMin, window.endMin, blockStart, blockEnd)) {
      result.push(window)
      continue
    }
    if (window.startMin < blockStart) {
      result.push({ ...window, endMin: blockStart })
    }
    if (window.endMin > blockEnd) {
      result.push({ ...window, startMin: blockEnd })
    }
  }
  return result
}

function ruleAppliesTo(rule: AvailabilityRuleInput, day: Date) {
  if (!rule.isActive) return false
  if (isoWeekday(day) !== rule.weekday) return false

  const key = dayKey(day)
  if (rule.validFrom && dateOnlyKey(rule.validFrom) > key) return false
  if (rule.validTo && dateOnlyKey(rule.validTo) < key) return false
  return true
}

/**
 * Okna dostępności dla jednego dnia: reguły tygodniowe + wyjątki EXTRA,
 * pomniejszone o wyjątki BLOCK.
 */
export function windowsForDay(
  day: Date,
  rules: AvailabilityRuleInput[],
  exceptions: AvailabilityExceptionInput[]
): { windows: Window[]; blockedAllDay: boolean } {
  const key = dayKey(day)
  const todaysExceptions = exceptions.filter(
    (exception) => dateOnlyKey(exception.date) === key
  )

  const wholeDayBlock = todaysExceptions.find(
    (exception) =>
      exception.type === "BLOCK" &&
      (exception.startMin === null || exception.endMin === null)
  )
  if (wholeDayBlock) return { windows: [], blockedAllDay: true }

  let windows: Window[] = rules
    .filter((rule) => ruleAppliesTo(rule, day))
    .map((rule) => ({
      startMin: rule.startMin,
      endMin: rule.endMin,
      locationId: rule.locationId,
    }))

  for (const exception of todaysExceptions) {
    if (exception.type !== "EXTRA") continue
    if (exception.startMin === null || exception.endMin === null) continue
    windows.push({
      startMin: exception.startMin,
      endMin: exception.endMin,
      locationId: exception.locationId,
    })
  }

  windows = mergeWindows(windows)

  for (const exception of todaysExceptions) {
    if (exception.type !== "BLOCK") continue
    if (exception.startMin === null || exception.endMin === null) continue
    windows = subtractRange(windows, exception.startMin, exception.endMin)
  }

  return { windows, blockedAllDay: false }
}

/**
 * Tnie okna na sloty i odrzuca te, które kolidują z zajętymi terminami,
 * wypadają za blisko (lead time) albo za daleko w przyszłość.
 *
 * `busy` powinno zawierać rezerwacje PENDING i CONFIRMED — zgłoszenie czekające
 * na decyzję też trzyma termin, żeby dwóch uczniów nie zapisało się na to samo.
 */
export function computeAvailability({
  from,
  days,
  rules,
  exceptions,
  busy,
  settings,
  now = new Date(),
}: {
  from: Date
  days: number
  rules: AvailabilityRuleInput[]
  exceptions: AvailabilityExceptionInput[]
  busy: BusyInterval[]
  settings: LessonSettings
  now?: Date
}): AvailabilityDay[] {
  const earliest = new Date(now.getTime() + settings.minLeadHours * 3_600_000)
  const latest = new Date(now.getTime() + settings.maxAdvanceDays * 86_400_000)
  const step = settings.slotMinutes + settings.bufferMinutes

  const result: AvailabilityDay[] = []

  for (let offset = 0; offset < days; offset++) {
    const day = startOfDay(from)
    day.setDate(day.getDate() + offset)

    const { windows, blockedAllDay } = windowsForDay(day, rules, exceptions)
    if (blockedAllDay) {
      const reason = exceptions.find(
        (exception) =>
          dateOnlyKey(exception.date) === dayKey(day) &&
          exception.type === "BLOCK" &&
          exception.startMin === null
      )
      result.push({
        date: day,
        slots: [],
        blockedReason: reason ? "Dzień zablokowany" : undefined,
      })
      continue
    }

    const slots: Slot[] = []
    for (const window of windows) {
      for (
        let start = window.startMin;
        start + settings.slotMinutes <= window.endMin;
        start += step
      ) {
        const startsAt = atMinutes(day, start)
        const endsAt = atMinutes(day, start + settings.slotMinutes)

        if (startsAt < earliest || startsAt > latest) continue

        // Bufor po lekcji liczy się także względem zajętych terminów.
        const blockedBy = busy.some((interval) =>
          overlaps(
            startsAt.getTime(),
            endsAt.getTime() + settings.bufferMinutes * 60_000,
            interval.startsAt.getTime(),
            interval.endsAt.getTime() + settings.bufferMinutes * 60_000
          )
        )
        if (blockedBy) continue

        slots.push({ startsAt, endsAt, locationId: window.locationId })
      }
    }

    slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    result.push({ date: day, slots })
  }

  return result
}

export type GroupSchedule = {
  weekday: number
  startMin: number
  meetingMinutes: number
  startsOn: Date | null
  endsOn: Date | null
  isActive: boolean
}

/**
 * Spotkania grup w zadanym oknie. Grupa ma stały termin w tygodniu, więc
 * zamiast trzymać setki rekordów rozwijamy je w locie — tak samo jak wolne sloty.
 * Wynik trafia do `busy`, żeby nikt nie zapisał się indywidualnie na godzinę,
 * w której nauczyciel prowadzi grupę.
 */
export function groupMeetingsInRange(
  groups: GroupSchedule[],
  from: Date,
  days: number
): BusyInterval[] {
  const meetings: BusyInterval[] = []

  for (let offset = 0; offset < days; offset++) {
    const day = new Date(from)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() + offset)
    const key = dayKey(day)

    for (const group of groups) {
      if (!group.isActive) continue
      if (isoWeekday(day) !== group.weekday) continue
      if (group.startsOn && dateOnlyKey(group.startsOn) > key) continue
      if (group.endsOn && dateOnlyKey(group.endsOn) < key) continue

      const startsAt = new Date(day)
      startsAt.setHours(0, group.startMin, 0, 0)
      meetings.push({
        startsAt,
        endsAt: new Date(startsAt.getTime() + group.meetingMinutes * 60_000),
      })
    }
  }

  return meetings
}
