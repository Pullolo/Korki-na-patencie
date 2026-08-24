import type { Metadata } from "next"

import { ComingSoon } from "@/components/dashboard/coming-soon"
import { ensureAdminPage } from "@/lib/auth"

export const metadata: Metadata = { title: "Nawigacja" }

export default async function Page() {
  await ensureAdminPage()

  return (
    <ComingSoon
      stage="etap 3.5, po zbudowaniu frontendu"
      title="Nawigacja"
      subtitle="Menu górne i stopka"
      planned={[
        "Kolejność pozycji metodą przeciągnij i upuść",
        "Zagnieżdżone podmenu",
        "Osobne zestawy dla nagłówka i stopki",
      ]}
    />
  )
}
