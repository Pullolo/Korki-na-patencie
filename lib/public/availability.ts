import type {
  AvailabilityExceptionInput,
  AvailabilityRuleInput,
  BusyInterval,
} from "@/lib/availability"
import { computeAvailability, groupMeetingsInRange } from "@/lib/availability"
import { dayKey } from "@/lib/dates"
import { formatTime, personName } from "@/lib/format"
import type { LocationType } from "@/lib/generated/prisma/enums"
import { resolveHourlyPrice } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"
import { getPriceRules } from "@/lib/public/pricing"
import { getSiteSettings } from "@/lib/public/settings"
import type {
  BoardDay,
  BoardSlot,
  BoardTeacher,
  SlotBoard,
} from "@/lib/public/slot-board"
import { priceKey } from "@/lib/public/slot-board"

/**
 * Wolne terminy dla strony publicznej — sedno całego produktu.
 *
 * Nigdy z cache'a: godzina, którą widzi uczeń, musi być naprawdę wolna
 * (`PRODUCT.md`, Positioning). Zapytania idą jednym strzałem na typ, nie
 * w pętli po nauczycielach — pętla `await` zamienia jedną stronę w kilkanaście
 * round-tripów i psuje TTFB dokładnie tam, gdzie boli: w pierwszym widoku
 * na telefonie.
 */

export type SlotQuery = {
  subjectId?: string | null
  levelId?: string | null
  mode?: LocationType | null
  teacherProfileId?: string | null
  from?: Date
  days?: number
}

export type {
  BoardDay,
  BoardSlot,
  BoardTeacher,
  SlotBoard,
} from "@/lib/public/slot-board"
export { priceKey } from "@/lib/public/slot-board"

const weekdayFormat = new Intl.DateTimeFormat("pl-PL", { weekday: "short" })
const monthFormat = new Intl.DateTimeFormat("pl-PL", { month: "short" })

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function buildDays(from: Date, days: number): BoardDay[] {
  const todayKey = dayKey(new Date())
  return Array.from({ length: days }, (_, offset) => {
    const date = startOfDay(from)
    date.setDate(date.getDate() + offset)
    return {
      key: dayKey(date),
      weekday: weekdayFormat.format(date),
      dayNumber: String(date.getDate()),
      month: monthFormat.format(date).replace(".", ""),
      isToday: dayKey(date) === todayKey,
    }
  })
}

/**
 * Grafik kilku nauczycieli naraz, gotowy do podania klientowi.
 *
 * Nauczyciel jest wynikiem wyboru godziny, nie kolejnym pytaniem — dlatego
 * tablica zwraca wszystkie sloty razem, a filtrowanie po przedmiocie robi się
 * po stronie klienta na podstawie tego, kto czego uczy.
 */
export async function getSlotBoard(query: SlotQuery = {}): Promise<SlotBoard> {
  const days = query.days ?? 5
  const from = startOfDay(query.from ?? new Date())
  const until = new Date(from)
  until.setDate(until.getDate() + days)

  const settings = await getSiteSettings()

  const profiles = await prisma.teacherProfile.findMany({
    where: {
      isPublished: true,
      ...(query.teacherProfileId ? { id: query.teacherProfileId } : {}),
      ...(query.subjectId || query.levelId
        ? {
            subjects: {
              some: {
                isActive: true,
                ...(query.subjectId ? { subjectId: query.subjectId } : {}),
                ...(query.levelId
                  ? { levels: { some: { id: query.levelId } } }
                  : {}),
              },
            },
          }
        : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      slotMinutes: true,
      bufferMinutes: true,
      minLeadHours: true,
      maxAdvanceDays: true,
      isAcceptingStudents: true,
      user: { select: { firstName: true, lastName: true, imageUrl: true } },
      subjects: {
        where: { isActive: true, subject: { isActive: true } },
        select: {
          subjectId: true,
          levels: { where: { isActive: true }, select: { id: true } },
        },
      },
      locations: {
        where: { isActive: true },
        select: { id: true, name: true, type: true, city: true },
      },
    },
  })

  if (profiles.length === 0) {
    return { days: buildDays(from, days), slots: [], teachers: [], prices: {} }
  }

  const ids = profiles.map((profile) => profile.id)

  // Jedno zapytanie na typ, potem grupowanie w pamięci.
  const [rules, exceptions, bookings, groups, priceRules] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { teacherProfileId: { in: ids }, isActive: true },
      select: {
        teacherProfileId: true,
        weekday: true,
        startMin: true,
        endMin: true,
        locationId: true,
        validFrom: true,
        validTo: true,
        isActive: true,
      },
    }),
    prisma.availabilityException.findMany({
      where: {
        teacherProfileId: { in: ids },
        date: { gte: from, lt: until },
      },
      select: {
        teacherProfileId: true,
        date: true,
        type: true,
        startMin: true,
        endMin: true,
        locationId: true,
      },
    }),
    // Zgłoszenie czekające na decyzję też trzyma termin — inaczej dwóch uczniów
    // zapisałoby się na tę samą godzinę.
    prisma.booking.findMany({
      where: {
        teacherProfileId: { in: ids },
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { lt: until },
        endsAt: { gt: from },
      },
      select: { teacherProfileId: true, startsAt: true, endsAt: true },
    }),
    prisma.courseGroup.findMany({
      where: { teacherProfileId: { in: ids }, isActive: true },
      select: {
        teacherProfileId: true,
        weekday: true,
        startMin: true,
        meetingMinutes: true,
        startsOn: true,
        endsOn: true,
        isActive: true,
      },
    }),
    getPriceRules(),
  ])

  function byTeacher<T extends { teacherProfileId: string }>(rows: T[]) {
    const map = new Map<string, T[]>()
    for (const row of rows) {
      const list = map.get(row.teacherProfileId)
      if (list) list.push(row)
      else map.set(row.teacherProfileId, [row])
    }
    return map
  }

  const rulesByTeacher = byTeacher(rules)
  const exceptionsByTeacher = byTeacher(exceptions)
  const bookingsByTeacher = byTeacher(bookings)
  const groupsByTeacher = byTeacher(groups)

  const teachers: BoardTeacher[] = []
  const slots: BoardSlot[] = []
  const prices: Record<string, number> = {}

  for (const profile of profiles) {
    const locations = new Map(
      profile.locations.map((location) => [location.id, location])
    )

    const busy: BusyInterval[] = [
      ...(bookingsByTeacher.get(profile.id) ?? []).map((booking) => ({
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
      })),
      ...groupMeetingsInRange(groupsByTeacher.get(profile.id) ?? [], from, days),
    ]

    // Reguły globalne z ustawień są dolną granicą — nauczyciel może je u siebie
    // tylko zawęzić, nigdy poluzować.
    const availability = computeAvailability({
      from,
      days,
      rules: (rulesByTeacher.get(profile.id) ?? []) as AvailabilityRuleInput[],
      exceptions: (exceptionsByTeacher.get(profile.id) ??
        []) as AvailabilityExceptionInput[],
      busy,
      settings: {
        slotMinutes: profile.slotMinutes,
        bufferMinutes: profile.bufferMinutes,
        minLeadHours: Math.max(
          profile.minLeadHours,
          settings.bookingMinLeadHours
        ),
        maxAdvanceDays: Math.min(
          profile.maxAdvanceDays,
          settings.bookingMaxAdvanceDays
        ),
      },
    })

    for (const day of availability) {
      for (const slot of day.slots) {
        const location = slot.locationId
          ? (locations.get(slot.locationId) ?? null)
          : null
        if (query.mode && location?.type !== query.mode) continue

        slots.push({
          id: `${profile.id}|${slot.startsAt.toISOString()}`,
          dayKey: dayKey(slot.startsAt),
          time: formatTime(slot.startsAt),
          startsAt: slot.startsAt.toISOString(),
          minutes: profile.slotMinutes,
          teacherId: profile.id,
          locationId: location?.id ?? null,
          locationName: location?.name ?? null,
          locationCity: location?.city ?? null,
          mode: location?.type ?? null,
        })
      }
    }

    teachers.push({
      id: profile.id,
      slug: profile.slug,
      name: personName(profile.user),
      imageUrl: profile.user.imageUrl,
      minutes: profile.slotMinutes,
      isAcceptingStudents: profile.isAcceptingStudents,
      subjects: profile.subjects.map((link) => ({
        subjectId: link.subjectId,
        levelIds: link.levels.map((level) => level.id),
      })),
    })

    // Cennik dla kombinacji, które ten nauczyciel faktycznie prowadzi.
    // Wpis z pustym poziomem to stawka najniższa — pokazujemy ją, dopóki
    // uczeń nie wskaże poziomu.
    for (const link of profile.subjects) {
      const perLevel: number[] = []
      for (const level of link.levels) {
        const hourly = resolveHourlyPrice(priceRules, {
          levelId: level.id,
          subjectId: link.subjectId,
          teacherProfileId: profile.id,
        })
        if (hourly === null) continue
        prices[priceKey(link.subjectId, level.id, profile.id)] = hourly
        perLevel.push(hourly)
      }

      const fallback =
        perLevel.length > 0
          ? Math.min(...perLevel)
          : resolveHourlyPrice(priceRules, {
              subjectId: link.subjectId,
              teacherProfileId: profile.id,
            })
      if (fallback !== null) {
        prices[priceKey(link.subjectId, null, profile.id)] = fallback
      }
    }
  }

  // Przy równych godzinach zostaje kolejność nauczycieli z panelu.
  const order = new Map(ids.map((id, index) => [id, index]))
  slots.sort((a, b) => {
    if (a.startsAt !== b.startsAt) return a.startsAt < b.startsAt ? -1 : 1
    return (order.get(a.teacherId) ?? 0) - (order.get(b.teacherId) ?? 0)
  })

  return { days: buildDays(from, days), slots, teachers, prices }
}

/** Grafik jednego nauczyciela — na jego profil. */
export async function getTeacherDays(
  teacherProfileId: string,
  options: { from?: Date; days?: number } = {}
) {
  return getSlotBoard({ teacherProfileId, ...options })
}

/** Najbliższy wolny termin — do zdania „najbliżej: czwartek 17:00". */
export function firstSlot(board: SlotBoard) {
  return board.slots[0] ?? null
}
