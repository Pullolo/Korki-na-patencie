import type { Metadata } from "next"

import { ProfileForm } from "@/components/front/forms/profile-form"
import { ensureAccountPage } from "@/lib/auth"
import { getMyProfile } from "@/lib/public/account"
import { listLevels } from "@/lib/public/levels"

export const metadata: Metadata = { title: "Dane" }

export default async function AccountDataPage() {
  const ctx = await ensureAccountPage()
  const [profile, levels] = await Promise.all([
    getMyProfile(ctx.userId),
    listLevels(),
  ])

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Dane kontaktowe
        </h2>
        <p className="mt-2 max-w-[60ch] leading-relaxed text-front-muted">
          Używamy ich wyłącznie do umawiania i prowadzenia zajęć. Poziom
          i szkoła pomagają nauczycielowi przygotować pierwszą lekcję.
        </p>
      </div>

      <ProfileForm
        email={ctx.email}
        levels={levels.map((level) => ({ id: level.id, name: level.name }))}
        initial={{
          firstName: profile?.firstName ?? ctx.firstName ?? "",
          lastName: profile?.lastName ?? ctx.lastName ?? "",
          phone: profile?.phone ?? "",
          levelId: profile?.studentProfile?.levelId ?? "",
          schoolName: profile?.studentProfile?.schoolName ?? "",
          schoolClass: profile?.studentProfile?.schoolClass ?? "",
          guardianName: profile?.studentProfile?.guardianName ?? "",
          guardianPhone: profile?.studentProfile?.guardianPhone ?? "",
        }}
      />
    </div>
  )
}
