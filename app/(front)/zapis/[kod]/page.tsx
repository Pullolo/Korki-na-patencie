import { ArrowRight, CalendarClock, MapPin, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHero } from "@/components/front/layout/page-hero"
import { EnrollmentStatusChip } from "@/components/front/status-chip"
import { btnSecondary, cardBase } from "@/components/front/styles"
import { formatPrice, plural, WEEKDAYS } from "@/lib/format"
import type { EnrollmentStatus } from "@/lib/generated/prisma/enums"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import { getEnrollmentByReference } from "@/lib/public/groups"
import { getSiteSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Status zapisu",
  robots: { index: false, follow: false },
}

const EXPLANATION: Record<EnrollmentStatus, string> = {
  ACTIVE:
    "Miejsce w grupie jest Twoje. Szczegóły pierwszego spotkania wysyłamy mailem.",
  WAITLIST:
    "Wszystkie miejsca są w tej chwili zajęte, więc zapis czeka na liście rezerwowej. Odezwiemy się, gdy któreś się zwolni.",
  CANCELLED: "Ten zapis został anulowany.",
  FINISHED: "Ten kurs się zakończył. Dzięki za wspólny semestr!",
}

export default async function EnrollmentStatusPage({
  params,
}: {
  params: Promise<{ kod: string }>
}) {
  const { kod } = await params
  const enrollment = await getEnrollmentByReference(kod)
  if (!enrollment) notFound()

  const settings = await getSiteSettings()
  const status = enrollment.status as EnrollmentStatus
  const group = enrollment.group
  const weekday = WEEKDAYS.find((day) => day.value === group.weekday)

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Grupy", href: "/grupy" },
          { label: enrollment.reference },
        ]}
        title={
          status === "ACTIVE"
            ? "Jesteś zapisany"
            : status === "WAITLIST"
              ? "Zapis na liście rezerwowej"
              : "Status zapisu"
        }
        lead={EXPLANATION[status]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <EnrollmentStatusChip status={status} />
          <span className="font-body text-sm font-bold text-front-muted">
            Kod: <span className="tabular-nums">{enrollment.reference}</span>
          </span>
        </div>
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
          <div className={cn(cardBase, "p-6 sm:p-8")}>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              <Link
                href={`/grupy/${group.slug}`}
                className="transition-colors hover:text-front-brand"
              >
                {group.name}
              </Link>
            </h2>

            <ul className="mt-4 grid gap-2 text-front-muted">
              <li className="flex items-center gap-2.5">
                <CalendarClock className="size-4.5 shrink-0" />
                {weekday?.label ?? "termin do ustalenia"}, {group.startTime} ·{" "}
                {group.meetingsPerMonth}{" "}
                {plural(
                  group.meetingsPerMonth,
                  "spotkanie",
                  "spotkania",
                  "spotkań"
                )}{" "}
                × {group.meetingMinutes} min
              </li>
              <li className="flex items-center gap-2.5">
                <Users className="size-4.5 shrink-0" />
                Prowadzi {group.teacher.name}
              </li>
              {group.location && (
                <li className="flex items-center gap-2.5">
                  <MapPin className="size-4.5 shrink-0" />
                  {[
                    group.location.name,
                    LOCATION_TYPE_LABELS[group.location.type],
                    group.location.city,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </li>
              )}
            </ul>

            {enrollment.placeInLine !== null && (
              <p className="mt-5 rounded-2xl bg-front-sun-soft px-4 py-3 font-semibold text-front-ink">
                Jesteś {enrollment.placeInLine}. w kolejce.
              </p>
            )}

            <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-front-line pt-4">
              <span className="font-semibold text-front-muted">
                Opłata miesięczna
              </span>
              <span className="text-right">
                <span className="font-display text-2xl font-semibold">
                  {formatPrice(enrollment.monthlyPrice, settings.currency)}
                </span>
                {enrollment.discountPercent > 0 && (
                  <span className="mt-1 block font-body text-sm font-semibold text-front-mint">
                    z rabatem {enrollment.discountPercent}% dla uczniów zajęć
                    indywidualnych
                  </span>
                )}
              </span>
            </div>

            <p className="mt-5 font-body text-sm leading-relaxed text-front-muted">
              Zapis prowadzimy ręcznie — jeśli chcesz go zmienić albo
              zrezygnować, napisz do nas albo zadzwoń. Nic nie płacisz z góry
              przez stronę.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/grupy" className={btnSecondary}>
              Inne grupy
              <ArrowRight />
            </Link>
            <Link href="/kontakt" className={btnSecondary}>
              Napisz do nas
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
