import type { Metadata } from "next"

import { ComingSoon } from "@/components/dashboard/coming-soon"
import { ensureAdminPage } from "@/lib/auth"

export const metadata: Metadata = { title: "Strony" }

export default async function Page() {
  await ensureAdminPage()

  return (
    <ComingSoon
      stage="etap 3.5, po zbudowaniu frontendu"
      title="Strony"
      subtitle="Treści CMS"
      planned={[
        "Lista stron ze statusem szkic / opublikowana",
        "Edytor markdown z podglądem i polami SEO",
        "Strony typu: o mnie, cennik, regulamin, polityka prywatności",
      ]}
    />
  )
}
