import type { Metadata } from "next"

import { FaqTable } from "@/components/dashboard/content/faq-table"
import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { ensureAdminPage } from "@/lib/auth"
import { plural } from "@/lib/format"
import { getFaqs } from "@/lib/queries/content"

export const metadata: Metadata = { title: "FAQ" }

export default async function FaqPage() {
  await ensureAdminPage()
  const items = await getFaqs().catch(() => [])
  const visible = items.filter((item) => item.isPublished).length

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="FAQ"
        subtitle={`${items.length} ${plural(items.length, "pytanie", "pytania", "pytań")} · ${visible} widocznych na stronie`}
      />

      <div className="p-4 sm:p-6">
        <Panel
          title="Pytania i odpowiedzi"
          description="Sześć pierwszych pytań pokazuje się na stronie głównej, wszystkie na /faq. Kategoria o nazwie przedmiotu trafia też na jego podstronę."
          bodyClassName="p-0 sm:p-0"
        >
          <FaqTable items={items} />
        </Panel>
      </div>
    </div>
  )
}
