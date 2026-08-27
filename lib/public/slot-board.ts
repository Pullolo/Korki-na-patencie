import type { LocationType } from "@/lib/generated/prisma/enums"

/**
 * Kształt grafiku podawanego do komponentu wyboru terminu.
 *
 * Osobny moduł, bo czyta go także komponent kliencki — a `availability.ts`
 * ciągnie za sobą Prismę i tagi cache'a, których w przeglądarce być nie może.
 * Tutaj mieszkają wyłącznie typy i czyste funkcje.
 */

export type BoardTeacher = {
  id: string
  slug: string
  name: string
  imageUrl: string | null
  minutes: number
  isAcceptingStudents: boolean
  subjects: { subjectId: string; levelIds: string[] }[]
}

export type BoardSlot = {
  /** teacherId + znacznik czasu — klucz Reacta i identyfikator wyboru. */
  id: string
  dayKey: string
  time: string
  startsAt: string
  minutes: number
  teacherId: string
  locationId: string | null
  locationName: string | null
  locationCity: string | null
  mode: LocationType | null
}

export type BoardDay = {
  key: string
  weekday: string
  dayNumber: string
  month: string
  isToday: boolean
}

export type SlotBoard = {
  days: BoardDay[]
  slots: BoardSlot[]
  teachers: BoardTeacher[]
  /** Klucz z `priceKey()` → stawka godzinowa. */
  prices: Record<string, number>
}

/** Klucz w mapie cen. Pusty poziom = „nieokreślony", czyli stawka najniższa. */
export function priceKey(
  subjectId: string | null | undefined,
  levelId: string | null | undefined,
  teacherId: string
) {
  return `${subjectId ?? ""}|${levelId ?? ""}|${teacherId}`
}

/** Sloty pogrupowane po dniu — używane i w karcie wyboru, i w wyszukiwarce. */
export function slotsByDay(slots: BoardSlot[]) {
  const map = new Map<string, BoardSlot[]>()
  for (const slot of slots) {
    const list = map.get(slot.dayKey)
    if (list) list.push(slot)
    else map.set(slot.dayKey, [slot])
  }
  return map
}

/**
 * Czy nauczyciel prowadzi ten przedmiot (a przy wskazanym poziomie — także
 * ten poziom). Jedna reguła dla wyboru terminu i dla wyszukiwarki.
 */
export function teacherTeaches(
  teacher: BoardTeacher | undefined,
  subjectId: string | null | undefined,
  levelId: string | null | undefined
) {
  if (!teacher) return false
  if (!subjectId) return true
  const link = teacher.subjects.find((item) => item.subjectId === subjectId)
  if (!link) return false
  if (levelId && !link.levelIds.includes(levelId)) return false
  return true
}
