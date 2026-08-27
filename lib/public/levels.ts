import { cachedQuery } from "@/lib/public/cache"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

export type PublicLevel = {
  id: string
  name: string
  slug: string
  order: number
}

const load = cachedQuery(
  async () =>
    prisma.level.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, order: true },
    }),
  ["public-levels"],
  [TAGS.katalog]
)

/** Poziomy nauczania w kolejności z panelu. Ukryty poziom nie istnieje. */
export async function listLevels(): Promise<PublicLevel[]> {
  try {
    return await load()
  } catch {
    return []
  }
}
