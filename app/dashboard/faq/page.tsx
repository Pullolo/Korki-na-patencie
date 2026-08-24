import type { Metadata } from "next"

import { ComingSoon } from "@/components/dashboard/coming-soon"
import { ensureAdminPage } from "@/lib/auth"

export const metadata: Metadata = { title: "FAQ" }

export default async function Page() {
  await ensureAdminPage()

  return (
    <ComingSoon
      stage="etap 3.5, po zbudowaniu frontendu"
      title="FAQ"
      subtitle="Najczęstsze pytania"
      planned={[
        "Dodawanie pytań i odpowiedzi z kategoriami",
        "Kolejność wyświetlania i ukrywanie pozycji",
      ]}
    />
  )
}
