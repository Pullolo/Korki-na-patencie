import { cachedQuery } from "@/lib/public/cache"
import type { NavMenu } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { TAGS } from "@/lib/tags"

/**
 * Menu nagłówka i stopki. Do czasu, aż admin ułoży własne w `/dashboard/nawigacja`,
 * obowiązuje lista zapasowa — nagłówek bez linków byłby gorszy niż nagłówek
 * z kompletem tras, które i tak istnieją.
 */

export type NavItem = {
  label: string
  href: string
  children: { label: string; href: string }[]
}

const DEFAULT_HEADER: NavItem[] = [
  { label: "Terminy", href: "/terminy", children: [] },
  { label: "Przedmioty", href: "/przedmioty", children: [] },
  { label: "Nauczyciele", href: "/nauczyciele", children: [] },
  { label: "Cennik", href: "/cennik", children: [] },
  { label: "Grupy", href: "/grupy", children: [] },
  { label: "Pytania", href: "/faq", children: [] },
]

const DEFAULT_FOOTER: NavItem[] = [
  { label: "Wolne terminy", href: "/terminy", children: [] },
  { label: "Przedmioty", href: "/przedmioty", children: [] },
  { label: "Nauczyciele", href: "/nauczyciele", children: [] },
  { label: "Cennik", href: "/cennik", children: [] },
  { label: "Zajęcia grupowe", href: "/grupy", children: [] },
  { label: "Opinie", href: "/opinie", children: [] },
  { label: "Pytania", href: "/faq", children: [] },
  { label: "Kontakt", href: "/kontakt", children: [] },
]

const load = cachedQuery(
  async (menu: NavMenu) =>
    prisma.navLink.findMany({
      where: { menu, isActive: true, parentId: null },
      orderBy: [{ order: "asc" }, { label: "asc" }],
      select: {
        label: true,
        href: true,
        children: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { label: "asc" }],
          select: { label: true, href: true },
        },
      },
    }),
  ["public-nav"],
  [TAGS.cms]
)

export async function getNav(menu: NavMenu): Promise<NavItem[]> {
  try {
    const links = await load(menu)
    if (links.length > 0) return links
  } catch {
    // Baza może być niedostępna przy pierwszym uruchomieniu — nagłówek i tak
    // musi się wyrenderować.
  }
  return menu === "HEADER" ? DEFAULT_HEADER : DEFAULT_FOOTER
}
