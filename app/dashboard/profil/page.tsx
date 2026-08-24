import { redirect } from "next/navigation"

import { ensureDashboardPage } from "@/lib/auth"

/**
 * Skrót „Mój profil" dla nauczyciela — nie chcemy, żeby musiał znać własne id.
 * Admin nie ma profilu nauczyciela, więc ląduje na liście.
 */
export default async function MyProfilePage() {
  const ctx = await ensureDashboardPage()
  if (ctx.teacherProfileId) {
    redirect(`/dashboard/nauczyciele/${ctx.teacherProfileId}`)
  }
  redirect("/dashboard/nauczyciele")
}
