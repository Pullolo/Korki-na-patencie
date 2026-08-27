import { resolveHourlyPrice } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"
import { cachedQuery } from "@/lib/public/cache"
import { listLevels } from "@/lib/public/levels"
import { getPriceRules } from "@/lib/public/pricing"
import { listTeachers } from "@/lib/public/teachers"
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

/**
 * Karty przedmiotów gotowe do wyświetlenia: poziomy, których ktoś naprawdę
 * uczy, najniższa stawka z cennika i liczba nauczycieli.
 *
 * Ta sama funkcja obsługuje landing (`onlyTaught`) i katalog — inaczej
 * zasada „stawka od" żyłaby w dwóch miejscach i rozjechała się przy pierwszej
 * zmianie cennika.
 */
export async function listSubjectCards({
  onlyTaught = false,
}: { onlyTaught?: boolean } = {}) {
  const [subjects, levels, teachers, priceRules] = await Promise.all([
    listSubjects(),
    listLevels(),
    listTeachers(),
    getPriceRules(),
  ])

  const cards = subjects.map((subject) => {
    const taught = teachers.filter((teacher) =>
      teacher.subjects.some((item) => item.id === subject.id)
    )
    const levelIds = new Set(
      taught.flatMap(
        (teacher) =>
          teacher.subjects
            .find((item) => item.id === subject.id)
            ?.levels.map((level) => level.id) ?? []
      )
    )

    const taughtLevels = levels.filter((level) => levelIds.has(level.id))
    const prices = (taughtLevels.length > 0 ? taughtLevels : levels)
      .map((level) =>
        resolveHourlyPrice(priceRules, {
          subjectId: subject.id,
          levelId: level.id,
        })
      )
      .filter((price): price is number => price !== null)

    return {
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      description: subject.description,
      icon: subject.icon,
      levels: taughtLevels,
      // Przedmiot bez nauczyciela nie ma jeszcze ceny — nie zgadujemy jej
      // z cennika poziomów, których nikt nie prowadzi.
      fromPrice:
        taughtLevels.length > 0 && prices.length > 0
          ? Math.min(...prices)
          : null,
      teacherCount: taught.length,
    }
  })

  return onlyTaught ? cards.filter((card) => card.teacherCount > 0) : cards
}
