import type { Metadata } from "next"

import { NavEditor } from "@/components/dashboard/content/nav-editor"
import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { ensureAdminPage } from "@/lib/auth"
import { getNavLinks } from "@/lib/queries/content"

export const metadata: Metadata = { title: "Nawigacja" }

export default async function NavigationPage() {
  await ensureAdminPage()
  const links = await getNavLinks().catch(() => [])

  const header = links.filter((link) => link.menu === "HEADER")
  const footer = links.filter((link) => link.menu === "FOOTER")

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Nawigacja"
        subtitle="Menu w nagłówku i w stopce strony publicznej"
      />

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2 lg:items-start">
        <Panel
          title="Menu główne"
          description="Widoczne w nagłówku od szerokości laptopa; niżej chowa się pod przyciskiem menu."
          bodyClassName="p-0 sm:p-0"
        >
          <NavEditor menu="HEADER" links={header} />
        </Panel>

        <Panel
          title="Stopka"
          description="Lista linków w stopce. Strony CMS dopisują się tam same."
          bodyClassName="p-0 sm:p-0"
        >
          <NavEditor menu="FOOTER" links={footer} />
        </Panel>
      </div>
    </div>
  )
}
