import { cachedQuery } from "@/lib/public/cache"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

/**
 * Strony CMS. Filtr `PUBLISHED` idzie do zapytania, nie do JSX-a — szkic
 * nie istnieje dla strony publicznej.
 *
 * Daty zwracamy jako tekst ISO: wartość z `unstable_cache` przechodzi przez
 * serializację i `Date` nie zawsze wraca jako `Date`.
 */

export type PublicPage = {
  slug: string
  title: string
  content: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoOgImage: string | null
  noIndex: boolean
  updatedAt: string
}

const loadPage = cachedQuery(
  async (slug: string) => {
    const page = await prisma.page.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        content: true,
        seoTitle: true,
        seoDescription: true,
        seoOgImage: true,
        noIndex: true,
        updatedAt: true,
      },
    })
    if (!page) return null
    return { ...page, updatedAt: page.updatedAt.toISOString() }
  },
  ["public-page"],
  [TAGS.cms]
)

const loadList = cachedQuery(
  async () => {
    const pages = await prisma.page.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { slug: true, title: true, noIndex: true, updatedAt: true },
    })
    return pages.map((page) => ({
      ...page,
      updatedAt: page.updatedAt.toISOString(),
    }))
  },
  ["public-pages"],
  [TAGS.cms]
)

export async function getPage(slug: string): Promise<PublicPage | null> {
  return loadPage(slug)
}

export async function listPublishedPages() {
  try {
    return await loadList()
  } catch {
    return []
  }
}
