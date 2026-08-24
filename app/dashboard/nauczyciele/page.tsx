import { CalendarClock, GraduationCap } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ensureAdminPage } from "@/lib/auth"
import { formatPrice, plural } from "@/lib/format"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import { priceRange } from "@/lib/pricing"
import { getTeachers } from "@/lib/queries/people"
import { getActivePriceRules } from "@/lib/queries/pricing"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Nauczyciele" }

export default async function TeachersPage() {
  await ensureAdminPage()
  const [teachers, priceRules, settings] = await Promise.all([
    getTeachers().catch(() => []),
    getActivePriceRules().catch(() => []),
    getSiteSettingsSafe(),
  ])

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Nauczyciele"
        subtitle={`${teachers.length} ${plural(teachers.length, "profil", "profile", "profili")}`}
      />

      <div className="p-4 sm:p-6">
        {teachers.length === 0 ? (
          <Panel bodyClassName="p-0 sm:p-0">
            <EmptyState
              icon={<GraduationCap className="size-6" />}
              title="Brak nauczycieli"
              description="Nadaj komuś rolę Nauczyciel w sekcji Użytkownicy — profil utworzy się automatycznie."
            />
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teachers.map((teacher) => {
              const name =
                [teacher.user.firstName, teacher.user.lastName]
                  .filter(Boolean)
                  .join(" ") || teacher.user.email

              // Widełki liczymy po wszystkich kombinacjach, których uczy.
              const range = priceRange(
                priceRules,
                teacher.subjects.flatMap(({ subject, levels }) =>
                  levels.map((level) => ({
                    levelId: level.id,
                    subjectId: subject.id,
                    teacherProfileId: teacher.id,
                  }))
                )
              )

              return (
                <div
                  key={teacher.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/nauczyciele/${teacher.id}`}
                        className="truncate font-semibold text-foreground underline-offset-2 hover:underline"
                      >
                        {name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {teacher.headline || teacher.user.email}
                      </p>
                    </div>
                    <StatusBadge
                      label={teacher.isPublished ? "Widoczny" : "Szkic"}
                      tone={teacher.isPublished ? "green" : "neutral"}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {teacher.subjects.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Brak przypisanych przedmiotów
                      </span>
                    ) : (
                      teacher.subjects.map(({ subject }) => (
                        <span
                          key={subject.id}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {subject.name}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {teacher.locations.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Brak ustawionych lokalizacji
                      </span>
                    ) : (
                      teacher.locations.map((location) => (
                        <span
                          key={location.id}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          title={location.name}
                        >
                          {LOCATION_TYPE_LABELS[location.type]}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {range
                          ? range.min === range.max
                            ? formatPrice(range.min, settings.currency)
                            : `${range.min}–${formatPrice(range.max, settings.currency)}`
                          : "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        za godzinę
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {teacher._count.bookings}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        rezerwacji
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                        <CalendarClock className="size-3.5 text-muted-foreground" />
                        {teacher._count.availabilityRules}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        reguł grafiku
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
