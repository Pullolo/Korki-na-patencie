import type { Metadata } from "next"

import { ComingSoon } from "@/components/dashboard/coming-soon"
import { ensureAdminPage } from "@/lib/auth"

export const metadata: Metadata = { title: "Opinie" }

export default async function Page() {
  await ensureAdminPage()

  return (
    <ComingSoon
      stage="etap 3.5, po zbudowaniu frontendu"
      title="Opinie"
      subtitle="Moderacja opinii uczniów"
      planned={[
        "Kolejka opinii oczekujących na akceptację",
        "Publikacja, odrzucenie i odpowiedź nauczyciela",
        "Średnia ocen na profilu nauczyciela i przedmiotu",
      ]}
    />
  )
}
