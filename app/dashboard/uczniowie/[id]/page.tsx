import { CalendarDays } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { StudentProfileForm } from "@/components/dashboard/student-profile-form"
import { ensureDashboardPage } from "@/lib/auth"
import {
  formatDate,
  formatPrice,
  formatTime,
  personName,
  plural,
  teacherLabel,
} from "@/lib/format"
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES } from "@/lib/labels"
import { getLevels } from "@/lib/queries/catalog"
import { getStudentDetail } from "@/lib/queries/people"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Uczeń" }

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await ensureDashboardPage()
  const { id } = await params

  const [detail, levels, settings] = await Promise.all([
    getStudentDetail(ctx, id).catch(() => null),
    getLevels().catch(() => []),
    getSiteSettingsSafe(),
  ])

  if (!detail) notFound()
  const { student, bookings, totals } = detail

  const name = personName(student)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title={name}
        subtitle={student.email ?? undefined}
        backHref="/dashboard/uczniowie"
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel
            title="Historia lekcji"
            description={
              ctx.isAdmin
                ? "Wszystkie rezerwacje tego ucznia"
                : "Rezerwacje u Ciebie"
            }
            bodyClassName="p-0 sm:p-0"
          >
            {bookings.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="size-6" />}
                title="Brak rezerwacji"
                description="Ten uczeń nie ma jeszcze żadnej umówionej lekcji."
              />
            ) : (
              <ul className="divide-y divide-border">
                {bookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/rezerwacje/${booking.id}`}
                        className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                      >
                        {booking.subject?.name ?? "Bez przedmiotu"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.startsAt)},{" "}
                        {formatTime(booking.startsAt)}–
                        {formatTime(booking.endsAt)}
                        {ctx.isAdmin &&
                          ` · ${teacherLabel(booking.teacherProfile)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-xs text-muted-foreground sm:block">
                        {formatPrice(booking.price, settings.currency)}
                      </span>
                      <StatusBadge
                        label={BOOKING_STATUS_LABELS[booking.status]}
                        tone={BOOKING_STATUS_TONES[booking.status]}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Karta ucznia" description="Poziom, szkoła i notatki">
            <StudentProfileForm
              userId={student.id}
              levels={levels.map((level) => ({
                id: level.id,
                name: level.name,
              }))}
              initial={{
                levelId: student.studentProfile?.levelId ?? null,
                schoolName: student.studentProfile?.schoolName ?? null,
                schoolClass: student.studentProfile?.schoolClass ?? null,
                guardianName: student.studentProfile?.guardianName ?? null,
                guardianPhone: student.studentProfile?.guardianPhone ?? null,
                notes: student.studentProfile?.notes ?? null,
              }}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="W skrócie">
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Odbyte lekcje</dt>
                <dd className="text-foreground">{totals.lessons}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Wydał u nas</dt>
                <dd className="text-foreground">
                  {formatPrice(totals.spent, settings.currency)}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Wszystkie rezerwacje</dt>
                <dd className="text-foreground">
                  {bookings.length}{" "}
                  {plural(bookings.length, "sztuka", "sztuki", "sztuk")}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Konto od</dt>
                <dd className="text-foreground">
                  {formatDate(student.createdAt)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Kontakt">
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="truncate text-foreground">{student.email}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted-foreground">Telefon</dt>
                <dd className="text-foreground">{student.phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted-foreground">Opiekun</dt>
                <dd className="text-foreground">
                  {student.studentProfile?.guardianName ?? "—"}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  )
}
