import { ArrowRight, CalendarClock, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EnrollmentStatusChip } from "@/components/front/status-chip"
import { btnSecondary, cardBase } from "@/components/front/styles"
import { ensureAccountPage } from "@/lib/auth"
import { formatPrice, personName, plural, WEEKDAYS } from "@/lib/format"
import { minutesToTime } from "@/lib/format"
import { getMyEnrollments } from "@/lib/public/account"
import { getSiteSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Moje grupy" }

export default async function AccountGroupsPage() {
  const ctx = await ensureAccountPage()
  const [settings, enrollments] = await Promise.all([
    getSiteSettings(),
    getMyEnrollments(ctx.userId),
  ])

  if (enrollments.length === 0) {
    return (
      <div className={cn(cardBase, "p-8 text-center")}>
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-front-brand-soft text-front-brand">
          <Users className="size-6" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold">
          Nie jesteś zapisany do żadnej grupy
        </h2>
        <p className="mx-auto mt-2 max-w-[46ch] leading-relaxed text-front-muted">
          Grupa ma stały termin w tygodniu i rozliczenie miesięczne. Jeśli masz
          u nas zajęcia indywidualne, przy zapisie naliczymy rabat.
        </p>
        <Link href="/grupy" className={cn(btnSecondary, "mt-6")}>
          Zobacz grupy
          <ArrowRight />
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      {enrollments.map((enrollment) => {
        const group = enrollment.group
        const weekday = WEEKDAYS.find((day) => day.value === group.weekday)

        return (
          <article key={enrollment.id} className={cn(cardBase, "p-5 sm:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  <Link
                    href={`/grupy/${group.slug}`}
                    className="transition-colors hover:text-front-brand"
                  >
                    {group.name}
                  </Link>
                </h2>
                <ul className="mt-2 grid gap-1.5 font-body text-sm text-front-muted">
                  <li className="flex items-center gap-2">
                    <CalendarClock className="size-4 shrink-0" />
                    {weekday?.label ?? "termin do ustalenia"},{" "}
                    {minutesToTime(group.startMin)} · {group.meetingsPerMonth}{" "}
                    {plural(
                      group.meetingsPerMonth,
                      "spotkanie",
                      "spotkania",
                      "spotkań"
                    )}{" "}
                    × {group.meetingMinutes} min
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="size-4 shrink-0" />
                    Prowadzi {personName(group.teacherProfile.user)}
                    {group.subject ? ` · ${group.subject.name}` : ""}
                    {group.level ? ` · ${group.level.name}` : ""}
                  </li>
                </ul>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <EnrollmentStatusChip status={enrollment.status} />
                <Link
                  href={`/zapis/${enrollment.reference}`}
                  className="font-body text-sm font-bold text-front-brand hover:underline"
                >
                  Szczegóły
                </Link>
              </div>
            </div>

            <p className="mt-4 flex items-baseline justify-between gap-4 border-t border-front-line pt-4">
              <span className="font-semibold text-front-muted">
                Opłata miesięczna
              </span>
              <span className="text-right">
                <span className="font-display text-xl font-semibold">
                  {formatPrice(enrollment.monthlyPrice, settings.currency)}
                </span>
                {enrollment.discountPercent > 0 && (
                  <span className="mt-0.5 block font-body text-sm font-semibold text-front-mint">
                    z rabatem {enrollment.discountPercent}%
                  </span>
                )}
              </span>
            </p>
          </article>
        )
      })}
    </div>
  )
}
