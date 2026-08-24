import type { Metadata } from "next"

import { ComingSoon } from "@/components/dashboard/coming-soon"
import { ensureAdminPage } from "@/lib/auth"

export const metadata: Metadata = { title: "SEO" }

export default async function Page() {
  await ensureAdminPage()

  return (
    <ComingSoon
      title="SEO"
      subtitle="Meta tagi i widoczność w wyszukiwarkach"
      planned={[
        "Domyślny tytuł, opis i obrazek Open Graph",
        "Weryfikacja Google i Bing, przełącznik noindex",
        "Podgląd sitemap.xml i robots.txt",
      ]}
    />
  )
}
