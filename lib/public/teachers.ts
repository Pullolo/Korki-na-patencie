import { cachedQuery } from "@/lib/public/cache"
import { personName } from "@/lib/format"
import type { Prisma } from "@/lib/generated/prisma/client"
import type { LocationType } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

/**
 * Profile nauczycieli dla strony publicznej.
 *
 * `isPublished` jest filtrem twardym — nieopublikowany profil nie istnieje.
 * `isAcceptingStudents` to sygnał dla czytelnika („nie przyjmuje teraz"),
 * a nie filtr: nauczyciel z pełnym grafikiem dalej ma widoczne opinie i cennik.
 */

export type PublicLocation = {
  id: string
  name: string
  type: LocationType
  city: string | null
  address: string | null
  note: string | null
}

export type PublicTeacher = {
  id: string
  slug: string
  name: string
  imageUrl: string | null
  headline: string | null
  bio: string | null
  education: string | null
  experienceYears: number | null
  isAcceptingStudents: boolean
  order: number
  seoTitle: string | null
  seoDescription: string | null
  slotMinutes: number
  bufferMinutes: number
  minLeadHours: number
  maxAdvanceDays: number
  subjects: {
    id: string
    name: string
    slug: string
    note: string | null
    levels: { id: string; name: string; slug: string; order: number }[]
  }[]
  locations: PublicLocation[]
}

const SELECT = {
  id: true,
  slug: true,
  headline: true,
  bio: true,
  education: true,
  experienceYears: true,
  isAcceptingStudents: true,
  order: true,
  seoTitle: true,
  seoDescription: true,
  slotMinutes: true,
  bufferMinutes: true,
  minLeadHours: true,
  maxAdvanceDays: true,
  user: { select: { firstName: true, lastName: true, imageUrl: true } },
  subjects: {
    where: { isActive: true, subject: { isActive: true } },
    orderBy: [{ subject: { order: "asc" } }],
    select: {
      note: true,
      subject: { select: { id: true, name: true, slug: true } },
      levels: {
        where: { isActive: true },
        orderBy: [{ order: "asc" }],
        select: { id: true, name: true, slug: true, order: true },
      },
    },
  },
  locations: {
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      city: true,
      address: true,
      note: true,
    },
  },
} satisfies Prisma.TeacherProfileSelect

type Row = Prisma.TeacherProfileGetPayload<{ select: typeof SELECT }>

function toPublic(row: Row): PublicTeacher {
  const { user, subjects, ...rest } = row
  return {
    ...rest,
    name: personName(user),
    imageUrl: user.imageUrl,
    subjects: subjects.map((link) => ({
      id: link.subject.id,
      name: link.subject.name,
      slug: link.subject.slug,
      note: link.note,
      levels: link.levels,
    })),
  }
}

export type TeacherFilter = {
  subjectId?: string | null
  levelId?: string | null
  mode?: LocationType | null
}

const loadList = cachedQuery(
  async (filter: TeacherFilter) => {
    const rows = await prisma.teacherProfile.findMany({
      where: {
        isPublished: true,
        ...(filter.subjectId || filter.levelId
          ? {
              subjects: {
                some: {
                  isActive: true,
                  ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
                  ...(filter.levelId
                    ? { levels: { some: { id: filter.levelId } } }
                    : {}),
                },
              },
            }
          : {}),
        ...(filter.mode
          ? { locations: { some: { isActive: true, type: filter.mode } } }
          : {}),
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: SELECT,
    })
    return rows.map(toPublic)
  },
  ["public-teachers"],
  [TAGS.nauczyciele, TAGS.katalog]
)

const loadOne = cachedQuery(
  async (slug: string) => {
    const row = await prisma.teacherProfile.findFirst({
      where: { slug, isPublished: true },
      select: SELECT,
    })
    return row ? toPublic(row) : null
  },
  ["public-teacher"],
  [TAGS.nauczyciele, TAGS.katalog]
)

export async function listTeachers(
  filter: TeacherFilter = {}
): Promise<PublicTeacher[]> {
  try {
    return await loadList(filter)
  } catch {
    return []
  }
}

export async function getTeacher(slug: string): Promise<PublicTeacher | null> {
  return loadOne(slug)
}

/** Wszystkie slugi opublikowanych profili — do mapy witryny. */
export async function listTeacherSlugs() {
  try {
    return await prisma.teacherProfile.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: { slug: true, updatedAt: true },
    })
  } catch {
    return []
  }
}
