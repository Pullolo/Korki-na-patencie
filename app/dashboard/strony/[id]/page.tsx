import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageEditor } from "@/components/dashboard/content/page-editor"
import { Header } from "@/components/dashboard/header"
import { ensureAdminPage } from "@/lib/auth"
import { getPageById } from "@/lib/queries/content"

export const metadata: Metadata = { title: "Edycja strony" }

export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await ensureAdminPage()
  const { id } = await params
  const page = await getPageById(id)
  if (!page) notFound()

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title={page.title}
        subtitle={`/${page.slug}`}
        backHref="/dashboard/strony"
      />

      <div className="p-4 sm:p-6">
        <PageEditor
          id={page.id}
          initial={{
            title: page.title,
            slug: page.slug,
            content: page.content,
            status: page.status,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            seoOgImage: page.seoOgImage,
            noIndex: page.noIndex,
          }}
        />
      </div>
    </div>
  )
}
