import { CalendarClock, MapPin } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { LocationsManager } from "@/components/dashboard/catalog/locations-manager"
import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TeacherProfileForm } from "@/components/dashboard/teacher/profile-form"
import { TeacherSubjectsManager } from "@/components/dashboard/teacher/subjects-manager"
import { ensureDashboardPage } from "@/lib/auth"
import { personName, plural } from "@/lib/format"
import { getLevels, getSubjects } from "@/lib/queries/catalog"
import { getActivePriceRules } from "@/lib/queries/pricing"
import { getTeacherProfile } from "@/lib/queries/people"
import { resolveHourlyPrice } from "@/lib/pricing"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Profil nauczyciela" }

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await ensureDashboardPage()
  const { id } = await params

  // Nauczyciel wchodzi tylko na swój profil; cudzy to nie jego sprawa.
  if (!ctx.isAdmin && ctx.teacherProfileId !== id) redirect("/dashboard")

  const [teacher, subjects, levels, priceRules, settings] = await Promise.all([
    getTeacherProfile(id).catch(() => null),
    getSubjects().catch(() => []),
    getLevels().catch(() => []),
    getActivePriceRules().catch(() => []),
    getSiteSettingsSafe(),
  ])

  if (!teacher) notFound()

  const name = personName(teacher.user)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title={name}
        subtitle={teacher.user.email ?? undefined}
        backHref={ctx.isAdmin ? "/dashboard/nauczyciele" : "/dashboard"}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              label={teacher.isPublished ? "Widoczny" : "Szkic"}
              tone={teacher.isPublished ? "green" : "neutral"}
            />
            {!teacher.isAcceptingStudents && (
              <StatusBadge label="Nie przyjmuje" tone="amber" />
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Profil" description="To zobaczy uczeń na stronie">
            <TeacherProfileForm
              teacherProfileId={teacher.id}
              initial={{
                headline: teacher.headline,
                bio: teacher.bio,
                education: teacher.education,
                experienceYears: teacher.experienceYears,
                isPublished: teacher.isPublished,
                isAcceptingStudents: teacher.isAcceptingStudents,
                order: teacher.order,
              }}
            />
          </Panel>

          <Panel
            title="Przedmioty i stawki"
            description="Stawki pochodzą z cennika — tutaj wybierasz tylko, czego i na jakim poziomie uczysz"
          >
            <TeacherSubjectsManager
              teacherProfileId={teacher.id}
              currency={settings.currency}
              canEditPricing={ctx.isAdmin}
              levels={levels.map((level) => ({
                id: level.id,
                name: level.name,
              }))}
              subjectOptions={subjects.map((subject) => ({
                id: subject.id,
                name: subject.name,
              }))}
              rows={teacher.subjects.map((row) => ({
                id: row.id,
                subjectId: row.subject.id,
                subjectName: row.subject.name,
                note: row.note,
                isActive: row.isActive,
                levelIds: row.levels.map((level) => level.id),
                // Stawka bierze się z cennika dla tej kombinacji poziom + przedmiot + nauczyciel.
                prices: row.levels.map((level) => ({
                  levelName:
                    levels.find((item) => item.id === level.id)?.name ?? "—",
                  pricePerHour: resolveHourlyPrice(priceRules, {
                    levelId: level.id,
                    subjectId: row.subject.id,
                    teacherProfileId: teacher.id,
                  }),
                })),
              }))}
            />
          </Panel>

          <Panel
            title="Miejsca zajęć"
            description="Online, u nauczyciela albo z dojazdem do ucznia"
          >
            <LocationsManager
              teacherProfileId={teacher.id}
              locations={teacher.locations}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="W skrócie">
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Rezerwacje</dt>
                <dd className="text-foreground">{teacher._count.bookings}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Reguły grafiku</dt>
                <dd className="text-foreground">
                  {teacher._count.availabilityRules}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Opinie</dt>
                <dd className="text-foreground">{teacher._count.reviews}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Długość lekcji</dt>
                <dd className="text-foreground">
                  {teacher.slotMinutes} min
                  {teacher.bufferMinutes > 0 &&
                    ` + ${teacher.bufferMinutes} min przerwy`}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Adres profilu</dt>
                <dd className="font-mono text-xs text-muted-foreground">
                  /{teacher.slug}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Skróty">
            <div className="space-y-2">
              <Link
                href={`/dashboard/dostepnosc?nauczyciel=${teacher.id}`}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <CalendarClock className="size-4 text-muted-foreground" />
                Grafik i wolne terminy
              </Link>
              <Link
                href={`/dashboard/kalendarz?nauczyciel=${teacher.id}`}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <MapPin className="size-4 text-muted-foreground" />
                Kalendarz lekcji
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {teacher._count.availabilityRules === 0
                ? "Ten nauczyciel nie ma jeszcze żadnej reguły grafiku, więc nikt się do niego nie zapisze."
                : `${teacher._count.availabilityRules} ${plural(teacher._count.availabilityRules, "reguła", "reguły", "reguł")} w siatce tygodnia.`}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
