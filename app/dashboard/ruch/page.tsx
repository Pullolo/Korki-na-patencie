import type { Metadata } from "next"

import { ComingSoon } from "@/components/dashboard/coming-soon"
import { ensureAdminPage } from "@/lib/auth"

export const metadata: Metadata = { title: "Ruch na stronie" }

export default async function Page() {
  await ensureAdminPage()

  return (
    <ComingSoon
      stage="etap 3, razem z frontendem (bez niego nie ma czego mierzyć)"
      title="Ruch na stronie"
      subtitle="Odsłony i źródła wejść"
      planned={[
        "Odsłony dzień po dniu na podstawie tabeli PageView",
        "Najpopularniejsze strony i profile nauczycieli",
        "Źródła ruchu (referrer) i podział na urządzenia",
      ]}
    />
  )
}
