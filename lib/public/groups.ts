import { minutesToTime, personName } from "@/lib/format"
import type { LocationType } from "@/lib/generated/prisma/enums"
import { groupHourlyEquivalent } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"
import { cachedQuery } from "@/lib/public/cache"
import { TAGS } from "@/lib/tags"

/**
 * Zajęcia grupowe.
 *
 * Definicja grupy idzie z cache'a (tag `grupy`), ale **liczba wolnych miejsc
 * nigdy** — to samo, co z wolnymi terminami: informacja, która jest fałszywa
 * po pierwszym zapisie, jest gorsza niż jej brak.
 */

export type PublicGroup = {
  id: string
  name: string
  slug: string
  description: string | null
  minSeats: number
  maxSeats: number
  meetingsPerMonth: number
  meetingMinutes: number
  pricePerMonth: number
  hourlyEquivalent: number | null
  weekday: number
  startMin: number
  startTime: string
  startsOn: string | null
  endsOn: string | null
  teacher: { id: string; name: string; slug: string }
  subject: { id: string; name: string; slug: string } | null
  level: { id: string; name: string; slug: string } | null
  location: { name: string; type: LocationType; city: string | null } | null
}

export type GroupWithSeats = PublicGroup & {
  taken: number
  seatsLeft: number
  waitlist: number
}

const SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  minSeats: true,
  maxSeats: true,
  meetingsPerMonth: true,
  meetingMinutes: true,
  pricePerMonth: true,
  weekday: true,
  startMin: true,
  startsOn: true,
  endsOn: true,
  teacherProfile: {
    select: {
      id: true,
      slug: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  subject: { select: { id: true, name: true, slug: true } },
  level: { select: { id: true, name: true, slug: true } },
  location: { select: { name: true, type: true, city: true } },
}

type Row = {
  id: string
  name: string
  slug: string
  description: string | null
  minSeats: number
  maxSeats: number
  meetingsPerMonth: number
  meetingMinutes: number
  pricePerMonth: number
  weekday: number
  startMin: number
  startsOn: Date | null
  endsOn: Date | null
  teacherProfile: {
    id: string
    slug: string
    user: { firstName: string | null; lastName: string | null }
  }
  subject: { id: string; name: string; slug: string } | null
  level: { id: string; name: string; slug: string } | null
  location: { name: string; type: LocationType; city: string | null } | null
}

function toPublic(row: Row): PublicGroup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    minSeats: row.minSeats,
    maxSeats: row.maxSeats,
    meetingsPerMonth: row.meetingsPerMonth,
    meetingMinutes: row.meetingMinutes,
    pricePerMonth: row.pricePerMonth,
    hourlyEquivalent: groupHourlyEquivalent(row),
    weekday: row.weekday,
    startMin: row.startMin,
    startTime: minutesToTime(row.startMin),
    startsOn: row.startsOn?.toISOString() ?? null,
    endsOn: row.endsOn?.toISOString() ?? null,
    teacher: {
      id: row.teacherProfile.id,
      slug: row.teacherProfile.slug,
      name: personName(row.teacherProfile.user),
    },
    subject: row.subject,
    level: row.level,
    location: row.location,
  }
}

const loadList = cachedQuery(
  async () => {
    const rows = await prisma.courseGroup.findMany({
      where: { isPublished: true, isActive: true },
      orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
      select: SELECT,
    })
    return rows.map((row) => toPublic(row as Row))
  },
  ["public-groups"],
  [TAGS.grupy, TAGS.katalog, TAGS.nauczyciele]
)

const loadOne = cachedQuery(
  async (slug: string) => {
    const row = await prisma.courseGroup.findFirst({
      where: { slug, isPublished: true, isActive: true },
      select: SELECT,
    })
    return row ? toPublic(row as Row) : null
  },
  ["public-group"],
  [TAGS.grupy, TAGS.katalog, TAGS.nauczyciele]
)

/** Zajęte i wolne miejsca — zawsze świeżo z bazy. */
export async function seatsFor(groups: PublicGroup[]) {
  if (groups.length === 0) return new Map<string, { taken: number; waitlist: number }>()

  const counts = await prisma.groupEnrollment.groupBy({
    by: ["groupId", "status"],
    where: {
      groupId: { in: groups.map((group) => group.id) },
      status: { in: ["ACTIVE", "WAITLIST"] },
    },
    _count: { _all: true },
  })

  const map = new Map<string, { taken: number; waitlist: number }>()
  for (const group of groups) map.set(group.id, { taken: 0, waitlist: 0 })
  for (const row of counts) {
    const entry = map.get(row.groupId)
    if (!entry) continue
    if (row.status === "ACTIVE") entry.taken = row._count._all
    else entry.waitlist = row._count._all
  }
  return map
}

function withSeats(
  group: PublicGroup,
  counts: { taken: number; waitlist: number } | undefined
): GroupWithSeats {
  const taken = counts?.taken ?? 0
  return {
    ...group,
    taken,
    waitlist: counts?.waitlist ?? 0,
    seatsLeft: Math.max(0, group.maxSeats - taken),
  }
}

export async function listGroups(): Promise<GroupWithSeats[]> {
  try {
    const groups = await loadList()
    const counts = await seatsFor(groups)
    return groups.map((group) => withSeats(group, counts.get(group.id)))
  } catch {
    return []
  }
}

export async function getGroup(slug: string): Promise<GroupWithSeats | null> {
  const group = await loadOne(slug)
  if (!group) return null
  const counts = await seatsFor([group])
  return withSeats(group, counts.get(group.id))
}

export async function listGroupSlugs() {
  try {
    return await prisma.courseGroup.findMany({
      where: { isPublished: true, isActive: true },
      select: { slug: true, updatedAt: true },
    })
  } catch {
    return []
  }
}

export type PublicEnrollment = {
  reference: string
  status: string
  discountPercent: number
  monthlyPrice: number
  startedOn: Date
  studentName: string
  group: PublicGroup
  /** Ile osób czeka przed tą, gdy zapis trafił na listę rezerwową. */
  placeInLine: number | null
}

/**
 * Zapis do grupy po kodzie — strona `/zapis/[kod]`. Jak przy rezerwacji,
 * kod jest kluczem dostępu i nie pokazujemy nic o innych uczestnikach
 * poza tym, ile osób czeka przed tą.
 */
export async function getEnrollmentByReference(
  reference: string
): Promise<PublicEnrollment | null> {
  const enrollment = await prisma.groupEnrollment.findUnique({
    where: { reference: reference.toUpperCase() },
    select: {
      reference: true,
      status: true,
      discountPercent: true,
      monthlyPrice: true,
      startedOn: true,
      createdAt: true,
      guestName: true,
      student: { select: { firstName: true, lastName: true, email: true } },
      group: { select: SELECT },
    },
  })
  if (!enrollment) return null

  const placeInLine =
    enrollment.status === "WAITLIST"
      ? await prisma.groupEnrollment.count({
          where: {
            groupId: (enrollment.group as { id: string }).id,
            status: "WAITLIST",
            createdAt: { lt: enrollment.createdAt },
          },
        })
      : null

  return {
    reference: enrollment.reference,
    status: enrollment.status,
    discountPercent: enrollment.discountPercent,
    monthlyPrice: enrollment.monthlyPrice,
    startedOn: enrollment.startedOn,
    studentName: enrollment.student
      ? personName(enrollment.student)
      : (enrollment.guestName ?? "Uczeń"),
    group: toPublic(enrollment.group as Row),
    placeInLine: placeInLine === null ? null : placeInLine + 1,
  }
}
