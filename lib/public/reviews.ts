import { cachedQuery } from "@/lib/public/cache"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

/**
 * Opinie na stronie. Filtr `APPROVED` jest jedyną bramką — opinia czekająca
 * na moderację i odrzucona nie istnieją dla czytelnika.
 */

export type PublicReview = {
  id: string
  authorName: string
  rating: number
  content: string
  publishedAt: string | null
  teacher: { name: string; slug: string } | null
  subject: { name: string; slug: string } | null
}

const load = cachedQuery(
  async (filter: {
    teacherProfileId?: string | null
    subjectId?: string | null
    limit?: number
  }) => {
    const rows = await prisma.review.findMany({
      where: {
        status: "APPROVED",
        ...(filter.teacherProfileId
          ? { teacherProfileId: filter.teacherProfileId }
          : {}),
        ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: filter.limit ?? 24,
      select: {
        id: true,
        authorName: true,
        rating: true,
        content: true,
        publishedAt: true,
        teacherProfile: {
          select: {
            slug: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        subject: { select: { name: true, slug: true } },
      },
    })

    return rows.map((row) => ({
      id: row.id,
      authorName: row.authorName,
      rating: row.rating,
      content: row.content,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      teacher: row.teacherProfile
        ? {
            slug: row.teacherProfile.slug,
            name:
              [
                row.teacherProfile.user.firstName,
                row.teacherProfile.user.lastName,
              ]
                .filter(Boolean)
                .join(" ") || "Nauczyciel",
          }
        : null,
      subject: row.subject,
    }))
  },
  ["public-reviews"],
  [TAGS.opinie]
)

export async function listReviews(
  filter: {
    teacherProfileId?: string | null
    subjectId?: string | null
    limit?: number
  } = {}
): Promise<PublicReview[]> {
  try {
    return await load(filter)
  } catch {
    return []
  }
}

/**
 * Średnia ocen. Nie pokazujemy jej jako `AggregateRating` w JSON-LD, dopóki
 * opinie są zaślepkami z seeda — schema.org to deklaracja faktu, a `PRODUCT.md`
 * zabrania podawania zmyślonych ocen.
 */
export function averageRating(reviews: PublicReview[]) {
  if (reviews.length === 0) return null
  const sum = reviews.reduce((total, review) => total + review.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}
