import {
  computeAvailability,
  groupMeetingsInRange,
  type AvailabilityDay,
} from "@/lib/availability"
import { prisma } from "@/lib/prisma"

/** Statusy, które trzymają termin — patrz komentarz przy computeAvailability. */
const BUSY_STATUSES = ["PENDING", "CONFIRMED"] as const

export type TeacherSchedule = Awaited<ReturnType<typeof getTeacherSchedule>>

/** Wszystko, co edytor dostępności musi pokazać dla jednego nauczyciela. */
export async function getTeacherSchedule(teacherProfileId: string) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { id: teacherProfileId },
    select: {
      id: true,
      slotMinutes: true,
      bufferMinutes: true,
      minLeadHours: true,
      maxAdvanceDays: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      locations: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, name: true, type: true },
      },
      availabilityRules: {
        orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
        select: {
          id: true,
          weekday: true,
          startMin: true,
          endMin: true,
          locationId: true,
          validFrom: true,
          validTo: true,
          isActive: true,
          location: { select: { name: true, type: true } },
        },
      },
      courseGroups: {
        where: { isActive: true },
        select: {
          weekday: true,
          startMin: true,
          meetingMinutes: true,
          startsOn: true,
          endsOn: true,
          isActive: true,
        },
      },
      availabilityExceptions: {
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          type: true,
          startMin: true,
          endMin: true,
          locationId: true,
          reason: true,
        },
      },
    },
  })

  return profile
}

/** Wolne terminy nauczyciela na najbliższe `days` dni. */
export async function getAvailabilityPreview(
  teacherProfileId: string,
  days = 14
): Promise<AvailabilityDay[]> {
  const profile = await getTeacherSchedule(teacherProfileId)
  if (!profile) return []

  const from = new Date()
  const until = new Date(from.getTime() + days * 86_400_000)

  const busy = await prisma.booking.findMany({
    where: {
      teacherProfileId,
      status: { in: [...BUSY_STATUSES] },
      startsAt: { lt: until },
      endsAt: { gt: from },
    },
    select: { startsAt: true, endsAt: true },
  })

  // Godziny zajętych przez grupy blokują zapisy indywidualne.
  const groupMeetings = groupMeetingsInRange(profile.courseGroups, from, days)

  return computeAvailability({
    from,
    days,
    rules: profile.availabilityRules,
    exceptions: profile.availabilityExceptions,
    busy: [...busy, ...groupMeetings],
    settings: {
      slotMinutes: profile.slotMinutes,
      bufferMinutes: profile.bufferMinutes,
      minLeadHours: profile.minLeadHours,
      maxAdvanceDays: profile.maxAdvanceDays,
    },
  })
}

/** Lista profili do przełącznika nauczyciela (widoczna tylko dla admina). */
export async function getTeacherOptions() {
  return prisma.teacherProfile.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  })
}

/**
 * Liczba wolnych okienek dla wielu nauczycieli naraz — do obłożenia w
 * statystykach. Wersja w pętli wołała `getAvailabilityPreview()` per osoba,
 * czyli dwa zapytania na nauczyciela; tutaj idzie jedno zapytanie na typ
 * danych, dokładnie jak w publicznym `getSlotBoard()`.
 */
export async function countFreeSlots(
  teacherProfileIds: string[],
  days = 14
): Promise<number> {
  if (teacherProfileIds.length === 0) return 0

  const from = new Date()
  const until = new Date(from.getTime() + days * 86_400_000)

  const [profiles, rules, exceptions, busy, groups] = await Promise.all([
    prisma.teacherProfile.findMany({
      where: { id: { in: teacherProfileIds } },
      select: {
        id: true,
        slotMinutes: true,
        bufferMinutes: true,
        minLeadHours: true,
        maxAdvanceDays: true,
      },
    }),
    prisma.availabilityRule.findMany({
      where: { teacherProfileId: { in: teacherProfileIds } },
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
        teacherProfileId: { in: teacherProfileIds },
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
    prisma.booking.findMany({
      where: {
        teacherProfileId: { in: teacherProfileIds },
        status: { in: [...BUSY_STATUSES] },
        startsAt: { lt: until },
        endsAt: { gt: from },
      },
      select: { teacherProfileId: true, startsAt: true, endsAt: true },
    }),
    prisma.courseGroup.findMany({
      where: { teacherProfileId: { in: teacherProfileIds }, isActive: true },
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
  ])

  function group<T extends { teacherProfileId: string }>(rows: T[]) {
    const map = new Map<string, T[]>()
    for (const row of rows) {
      const list = map.get(row.teacherProfileId)
      if (list) list.push(row)
      else map.set(row.teacherProfileId, [row])
    }
    return map
  }

  const rulesBy = group(rules)
  const exceptionsBy = group(exceptions)
  const busyBy = group(busy)
  const groupsBy = group(groups)

  let total = 0
  for (const profile of profiles) {
    const days_ = computeAvailability({
      from,
      days,
      rules: rulesBy.get(profile.id) ?? [],
      exceptions: exceptionsBy.get(profile.id) ?? [],
      busy: [
        ...(busyBy.get(profile.id) ?? []),
        ...groupMeetingsInRange(groupsBy.get(profile.id) ?? [], from, days),
      ],
      settings: {
        slotMinutes: profile.slotMinutes,
        bufferMinutes: profile.bufferMinutes,
        minLeadHours: profile.minLeadHours,
        maxAdvanceDays: profile.maxAdvanceDays,
      },
    })
    for (const day of days_) total += day.slots.length
  }

  return total
}
