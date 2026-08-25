import { redirect } from "next/navigation"

import { ensureDashboardPage } from "@/lib/auth"

/**
 * Skrót „Mój profil" — nie chcemy, żeby ktokolwiek musiał znać własne id.
 * Kto nie ma profilu (zwykle admin, który nie uczy), ląduje na liście.
 */
export default async function MyProfilePage() {
  const ctx = await ensureDashboardPage()
  if (ctx.teacherProfileId) {
    redirect(`/dashboard/nauczyciele/${ctx.teacherProfileId}`)
  }
  redirect("/dashboard/nauczyciele")
}
