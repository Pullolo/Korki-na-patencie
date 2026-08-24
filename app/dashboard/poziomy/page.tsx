import type { Metadata } from "next"

import { LevelsTable } from "@/components/dashboard/catalog/levels-table"
import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { ensureAdminPage } from "@/lib/auth"
import { getLevels } from "@/lib/queries/catalog"

export const metadata: Metadata = { title: "Poziomy" }

export default async function LevelsPage() {
  await ensureAdminPage()
  const levels = await getLevels().catch(() => [])

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Poziomy"
        subtitle="Etapy nauki, do których nauczyciele przypisują przedmioty"
      />

      <div className="p-4 sm:p-6">
        <Panel bodyClassName="p-0 sm:p-0">
          <LevelsTable levels={levels} />
        </Panel>
      </div>
    </div>
  )
}
