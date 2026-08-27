import { cachedQuery } from "@/lib/public/cache"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

/**
 * Przedmioty widoczne na stronie. Filtr `isActive` idzie do zapytania —
 * przedmiot wyłączony w panelu nie ma prawa pojawić się w JSX-ie.
 */

export type PublicSubject = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  order: number
}

export type SubjectDetail = PublicSubject & {
  seoTitle: string | null
  seoDescription: string | null
  levels: { id: string; name: string; slug: string; order: number }[]
  teacherIds: string[]
}

const loadList = cachedQuery(
  async () =>
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        icon: true,
        order: true,
      },
    }),
  ["public-subjects"],
  [TAGS.katalog]
)

const loadDetail = cachedQuery(
  async (slug: string) => {
    const subject = await prisma.subject.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        icon: true,
        order: true,
        seoTitle: true,
        seoDescription: true,
        teacherSubjects: {
          where: {
            isActive: true,
            teacherProfile: { isPublished: true },
          },
          select: {
            teacherProfileId: true,
            levels: {
              where: { isActive: true },
              select: { id: true, name: true, slug: true, order: true },
            },
          },
        },
      },
    })
    if (!subject) return null

    // Poziomy przedmiotu wynikają z tego, kto go uczy — nie ma osobnej tabeli
    // „przedmiot × poziom", a poziom bez nauczyciela byłby obietnicą bez pokrycia.
    const levels = new Map<string, { id: string; name: string; slug: string; order: number }>()
    for (const link of subject.teacherSubjects) {
      for (const level of link.levels) levels.set(level.id, level)
    }

    const { teacherSubjects, ...rest } = subject
    return {
      ...rest,
      teacherIds: teacherSubjects.map((link) => link.teacherProfileId),
      levels: [...levels.values()].sort((a, b) => a.order - b.order),
    }
  },
  ["public-subject"],
  [TAGS.katalog, TAGS.nauczyciele]
)

export async function listSubjects(): Promise<PublicSubject[]> {
  try {
    return await loadList()
  } catch {
    return []
  }
}

export async function getSubject(slug: string): Promise<SubjectDetail | null> {
  return loadDetail(slug)
}
