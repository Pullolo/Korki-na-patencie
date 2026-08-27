import type { Metadata } from "next"

import { PagesTable } from "@/components/dashboard/content/pages-table"
import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { ensureAdminPage } from "@/lib/auth"
import { plural } from "@/lib/format"
import { getPages } from "@/lib/queries/content"

export const metadata: Metadata = { title: "Strony" }

export default async function PagesPage() {
  await ensureAdminPage()
  const pages = await getPages().catch(() => [])
  const published = pages.filter((page) => page.status === "PUBLISHED").length

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Strony"
        subtitle={`${pages.length} ${plural(pages.length, "strona", "strony", "stron")} · ${published} opublikowanych · widoczne w stopce serwisu`}
      />

      <div className="p-4 sm:p-6">
        <Panel bodyClassName="p-0 sm:p-0">
          <PagesTable pages={pages} />
        </Panel>
      </div>
    </div>
  )
}
