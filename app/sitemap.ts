import type { MetadataRoute } from "next"

import { listGroupSlugs } from "@/lib/public/groups"
import { listPublishedPages } from "@/lib/public/pages"
import { getSiteSettings } from "@/lib/public/settings"
import { listSubjects } from "@/lib/public/subjects"
import { listTeacherSlugs } from "@/lib/public/teachers"
import { absoluteUrl } from "@/lib/seo"

/**
 * Mapa witryny: trasy stałe plus wszystko, co ma slug w bazie.
 *
 * Strony pod kodem (`/rezerwacja/[kod]`, `/zapis/[kod]`), konto i panel
 * nie mają tu czego szukać — to nie są adresy do indeksowania.
 * `Page.noIndex` wypada, a `SiteSettings.noIndexSite` opróżnia mapę zupełnie.
 */

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/terminy", priority: 0.9, changeFrequency: "daily" },
  { path: "/nauczyciele", priority: 0.8, changeFrequency: "weekly" },
  { path: "/przedmioty", priority: 0.8, changeFrequency: "weekly" },
  { path: "/cennik", priority: 0.8, changeFrequency: "monthly" },
  { path: "/grupy", priority: 0.7, changeFrequency: "weekly" },
  { path: "/opinie", priority: 0.6, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/kontakt", priority: 0.7, changeFrequency: "monthly" },
  { path: "/rezerwacja", priority: 0.5, changeFrequency: "monthly" },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings()
  if (settings.noIndexSite) return []

  const [teachers, subjects, groups, pages] = await Promise.all([
    listTeacherSlugs(),
    listSubjects(),
    listGroupSlugs(),
    listPublishedPages(),
  ])

  const now = new Date()

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...teachers.map((teacher) => ({
      url: absoluteUrl(`/nauczyciele/${teacher.slug}`),
      lastModified: teacher.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...subjects.map((subject) => ({
      url: absoluteUrl(`/przedmioty/${subject.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...groups.map((group) => ({
      url: absoluteUrl(`/grupy/${group.slug}`),
      lastModified: group.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...pages
      .filter((page) => !page.noIndex)
      .map((page) => ({
        url: absoluteUrl(`/${page.slug}`),
        lastModified: new Date(page.updatedAt),
        changeFrequency: "yearly" as const,
        priority: 0.3,
      })),
  ]
}
