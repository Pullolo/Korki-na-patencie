import { cachedQuery } from "@/lib/public/cache"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

export type PublicFaq = {
  id: string
  question: string
  answer: string
  category: string | null
  order: number
}

const load = cachedQuery(
  async (category: string | null) =>
    prisma.faq.findMany({
      where: { isPublished: true, ...(category ? { category } : {}) },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        order: true,
      },
    }),
  ["public-faq"],
  [TAGS.cms]
)

export async function listFaq(category?: string | null): Promise<PublicFaq[]> {
  try {
    return await load(category ?? null)
  } catch {
    return []
  }
}

/** Pytania pogrupowane po kategorii; bez kategorii lądują w „Pozostałe". */
export function groupFaq(items: PublicFaq[]) {
  const groups = new Map<string, PublicFaq[]>()
  for (const item of items) {
    const key = item.category?.trim() || "Pozostałe"
    const list = groups.get(key)
    if (list) list.push(item)
    else groups.set(key, [item])
  }
  return [...groups.entries()].map(([category, questions]) => ({
    category,
    questions,
  }))
}
