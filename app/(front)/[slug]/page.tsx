import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHero } from "@/components/front/layout/page-hero"
import { MarkdownContent } from "@/components/markdown"
import { formatDate } from "@/lib/format"
import { getPage } from "@/lib/public/pages"
import { pageMetadata, seoDescription } from "@/lib/seo"

/**
 * Strona z CMS-u.
 *
 * Ta trasa jest ostatnia w kolejności rozstrzygania adresów: Next dopasowuje
 * segmenty statyczne przed dynamicznymi, więc `/cennik` zawsze trafia do
 * własnej strony, a tu ląduje tylko to, co nie pasuje nigdzie indziej.
 * Dlatego edytor w panelu pilnuje listy zarezerwowanych slugów — strona
 * o adresie zajętym przez trasę stałą nigdy by się nie otworzyła.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: "Nie znaleziono strony" }

  return pageMetadata({
    title: page.seoTitle || page.title,
    description: seoDescription(
      page.seoDescription,
      `${page.title} — ${(page.content ?? "").replace(/[#*_>\-`]/g, " ").trim().slice(0, 120)}`
    ),
    path: `/${page.slug}`,
    image: page.seoOgImage,
    noIndex: page.noIndex,
  })
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  return (
    <>
      <PageHero crumbs={[{ label: page.title }]} title={page.title} />

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
          {page.content ? (
            <MarkdownContent content={page.content} />
          ) : (
            <p className="leading-relaxed text-front-muted">
              Ta strona nie ma jeszcze treści.
            </p>
          )}

          <p className="mt-12 border-t border-front-line pt-5 font-body text-sm text-front-muted">
            Ostatnia aktualizacja: {formatDate(page.updatedAt)}
          </p>
        </div>
      </section>
    </>
  )
}
