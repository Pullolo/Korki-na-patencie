import { CalendarClock, CircleCheck, MapPin, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EnrollForm } from "@/components/front/forms/enroll-form"
import { JsonLd } from "@/components/front/json-ld"
import { PageHero } from "@/components/front/layout/page-hero"
import { cardBase, chip } from "@/components/front/styles"
import { formStamp } from "@/lib/actions/public/guard"
import { currentUser } from "@clerk/nextjs/server"
import { formatPrice, personName, plural, WEEKDAYS } from "@/lib/format"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import { prisma } from "@/lib/prisma"
import { getGroup } from "@/lib/public/groups"
import { getSiteSettings } from "@/lib/public/settings"
import { absoluteUrl, pageMetadata, seoDescription } from "@/lib/seo"
import { cn } from "@/lib/utils"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const group = await getGroup(slug)
  if (!group) return { title: "Nie znaleziono grupy" }

  const weekday = WEEKDAYS.find((day) => day.value === group.weekday)
  return pageMetadata({
    title: group.name,
    description: seoDescription(
      group.description,
      `${group.name} — ${group.meetingsPerMonth} spotkania w miesiącu, ${weekday?.label ?? "stały termin"} o ${group.startTime}. Zapisz się online.`
    ),
    path: `/grupy/${group.slug}`,
  })
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const group = await getGroup(slug)
  if (!group) notFound()

  const [settings, clerkUser] = await Promise.all([
    getSiteSettings(),
    currentUser(),
  ])

  const account = clerkUser
    ? await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
        select: { firstName: true, lastName: true, email: true, phone: true },
      })
    : null

  const weekday = WEEKDAYS.find((day) => day.value === group.weekday)
  const full = group.seatsLeft === 0

  const facts = [
    {
      icon: CalendarClock,
      label: "Termin",
      value: `${weekday?.label ?? "do ustalenia"}, ${group.startTime}`,
    },
    {
      icon: Users,
      label: "Miejsca",
      value: full
        ? `Komplet — ${group.waitlist} ${plural(group.waitlist, "osoba czeka", "osoby czekają", "osób czeka")}`
        : `${group.seatsLeft} z ${group.maxSeats} wolnych`,
    },
    {
      icon: CircleCheck,
      label: "Spotkania",
      value: `${group.meetingsPerMonth} × ${group.meetingMinutes} min w miesiącu`,
    },
    ...(group.location
      ? [
          {
            icon: MapPin,
            label: "Miejsce",
            value: [
              group.location.name,
              LOCATION_TYPE_LABELS[group.location.type],
              group.location.city,
            ]
              .filter(Boolean)
              .join(" · "),
          },
        ]
      : []),
  ]

  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: group.name,
    url: absoluteUrl(`/grupy/${group.slug}`),
    ...(group.description ? { description: group.description } : {}),
    provider: {
      "@type": "EducationalOrganization",
      name: settings.siteName,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode:
        group.location?.type === "ONLINE" ? "Online" : "Onsite",
      courseSchedule: {
        "@type": "Schedule",
        repeatFrequency: "P1W",
        byDay: weekday?.label,
        startTime: group.startTime,
        duration: `PT${group.meetingMinutes}M`,
      },
      offers: {
        "@type": "Offer",
        price: group.pricePerMonth,
        priceCurrency: settings.currency,
        availability:
          group.seatsLeft > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder",
      },
    },
  }

  return (
    <>
      <JsonLd data={course} />
      <PageHero
        crumbs={[{ label: "Grupy", href: "/grupy" }, { label: group.name }]}
        title={group.name}
        lead={group.description}
      >
        <div className="flex flex-wrap items-center gap-2">
          {group.level && (
            <span className={cn(chip, "bg-front-surface text-front-ink")}>
              {group.level.name}
            </span>
          )}
          {group.subject && (
            <span className={cn(chip, "bg-front-surface text-front-ink")}>
              {group.subject.name}
            </span>
          )}
          <span className={cn(chip, "bg-front-surface text-front-muted")}>
            Prowadzi{" "}
            <Link
              href={`/nauczyciele/${group.teacher.slug}`}
              className="ml-1 font-bold text-front-brand hover:underline"
            >
              {group.teacher.name}
            </Link>
          </span>
        </div>
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <div className={cn(cardBase, "p-6 sm:p-8")}>
              <p className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold">
                  {formatPrice(group.pricePerMonth, settings.currency)}
                </span>
                <span className="font-semibold text-front-muted">
                  / miesiąc
                </span>
              </p>
              {group.hourlyEquivalent && (
                <p className="mt-1 font-body text-sm font-semibold text-front-muted">
                  to {formatPrice(group.hourlyEquivalent, settings.currency)} za
                  godzinę zajęć
                </p>
              )}

              <dl className="mt-6 grid gap-4 border-t border-front-line pt-5 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-front-brand-soft text-front-brand">
                      <fact.icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <dt className="font-body text-sm font-bold text-front-muted">
                        {fact.label}
                      </dt>
                      <dd className="font-semibold">{fact.value}</dd>
                    </span>
                  </div>
                ))}
              </dl>

              {settings.groupDiscountPercent > 0 && (
                <p className="mt-6 rounded-2xl bg-front-sun-soft px-4 py-3 font-semibold text-front-ink">
                  Masz u nas zajęcia indywidualne? Zaloguj się przed zapisem —
                  naliczymy {settings.groupDiscountPercent}% rabatu.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {full ? "Zapisz się na listę rezerwową" : "Zapisz się do grupy"}
            </h2>
            <p className="mt-2 max-w-[52ch] leading-relaxed text-front-muted">
              {full
                ? "Wszystkie miejsca są zajęte. Zapis wchodzi na listę rezerwową — odezwiemy się, gdy któreś się zwolni."
                : "Zostaw kontakt, a potwierdzimy zapis i wyślemy szczegóły pierwszego spotkania."}
            </p>

            <div className="mt-6">
              <EnrollForm
                groupSlug={group.slug}
                full={full}
                stamp={formStamp()}
                defaults={{
                  name: account ? personName(account) : "",
                  email: account?.email ?? "",
                  phone: account?.phone ?? "",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
