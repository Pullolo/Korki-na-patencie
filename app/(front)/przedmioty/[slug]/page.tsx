import { ArrowRight, MessageCircle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { SlotPicker } from "@/components/front/booking/slot-picker"
import { TeacherCard } from "@/components/front/catalog/teacher-card"
import { JsonLd } from "@/components/front/json-ld"
import { PageHero } from "@/components/front/layout/page-hero"
import { FaqList } from "@/components/front/sections/faq"
import { btnSecondary, cardBase, chip } from "@/components/front/styles"
import { SubjectIcon } from "@/components/front/subject-icon"
import { subjectTone } from "@/components/front/subject-tone"
import { formatPrice, plural } from "@/lib/format"
import { resolveHourlyPrice } from "@/lib/pricing"
import { getSlotBoard } from "@/lib/public/availability"
import { listFaq } from "@/lib/public/faq"
import { listLevels } from "@/lib/public/levels"
import { getPriceRules } from "@/lib/public/pricing"
import { listReviews } from "@/lib/public/reviews"
import { getSiteSettings } from "@/lib/public/settings"
import { getSubject, listSubjects } from "@/lib/public/subjects"
import { listTeachers } from "@/lib/public/teachers"
import { absoluteUrl, pageMetadata, seoDescription } from "@/lib/seo"
import { cn } from "@/lib/utils"

const HORIZON_DAYS = 14

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const subject = await getSubject(slug)
  if (!subject) return { title: "Nie znaleziono przedmiotu" }

  return pageMetadata({
    title: subject.seoTitle || `Korepetycje — ${subject.name}`,
    description: seoDescription(
      subject.seoDescription || subject.description,
      `${subject.name} — korepetycje indywidualne. Sprawdź poziomy, ceny i wolne terminy.`
    ),
    path: `/przedmioty/${subject.slug}`,
  })
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const subject = await getSubject(slug)
  if (!subject) notFound()

  const [settings, allSubjects, levels, teachers, priceRules, board, faq, reviews] =
    await Promise.all([
      getSiteSettings(),
      listSubjects(),
      listLevels(),
      listTeachers({ subjectId: subject.id }),
      getPriceRules(),
      getSlotBoard({ subjectId: subject.id, days: HORIZON_DAYS }),
      listFaq(),
      listReviews({ subjectId: subject.id, limit: 3 }),
    ])

  const tone = subjectTone(
    Math.max(
      0,
      allSubjects.findIndex((item) => item.id === subject.id)
    )
  )

  const priceRows = subject.levels
    .map((level) => ({
      level,
      pricePerHour: resolveHourlyPrice(priceRules, {
        subjectId: subject.id,
        levelId: level.id,
      }),
    }))
    .filter((row) => row.pricePerHour !== null)

  const freeSlots: Record<string, number> = {}
  for (const slot of board.slots) {
    freeSlots[slot.teacherId] = (freeSlots[slot.teacherId] ?? 0) + 1
  }

  // Pytania przypisane do tego przedmiotu: kategoria zgadza się z nazwą.
  const subjectFaq = faq.filter(
    (item) => item.category?.toLowerCase() === subject.name.toLowerCase()
  )

  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `Korepetycje — ${subject.name}`,
    url: absoluteUrl(`/przedmioty/${subject.slug}`),
    ...(subject.description ? { description: subject.description } : {}),
    provider: {
      "@type": "EducationalOrganization",
      name: settings.siteName,
    },
    ...(priceRows.length > 0
      ? {
          offers: priceRows.map((row) => ({
            "@type": "Offer",
            name: row.level.name,
            price: row.pricePerHour,
            priceCurrency: settings.currency,
          })),
        }
      : {}),
  }

  return (
    <>
      <JsonLd data={course} />
      <PageHero
        crumbs={[
          { label: "Przedmioty", href: "/przedmioty" },
          { label: subject.name },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-4">
            <span
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl",
                tone.soft
              )}
            >
              <SubjectIcon subject={subject} className="size-7" />
            </span>
            {subject.name}
          </span>
        }
        lead={subject.description}
      >
        <div className="flex flex-wrap items-center gap-2">
          {subject.levels.map((level) => (
            <span
              key={level.id}
              className={cn(chip, "bg-front-surface text-front-ink")}
            >
              {level.name}
            </span>
          ))}
          <span className={cn(chip, "bg-front-surface text-front-muted")}>
            {teachers.length}{" "}
            {plural(teachers.length, "nauczyciel", "nauczycieli", "nauczycieli")}
          </span>
        </div>
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14">
          <div className="min-w-0">
            {priceRows.length > 0 && (
              <>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  Ile kosztuje godzina
                </h2>
                <div
                  className={cn(
                    cardBase,
                    "mt-4 divide-y divide-front-line overflow-hidden"
                  )}
                >
                  {priceRows.map((row) => (
                    <div
                      key={row.level.id}
                      className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                    >
                      <span className="font-display text-lg font-semibold">
                        {row.level.name}
                      </span>
                      <span className="shrink-0 font-display text-xl font-semibold whitespace-nowrap">
                        {formatPrice(row.pricePerHour, settings.currency)}
                        <span className="ml-1 font-body text-sm font-semibold text-front-muted">
                          / 60 min
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 max-w-[60ch] font-body text-sm leading-relaxed text-front-muted">
                  Stawka jest ta sama online i stacjonarnie. Płacisz po lekcji.{" "}
                  <Link
                    href="/cennik"
                    className="font-semibold text-front-brand hover:underline"
                  >
                    Pełny cennik
                  </Link>
                  .
                </p>
              </>
            )}

            <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
              Kto uczy
            </h2>
            {teachers.length > 0 ? (
              <div
                className={cn(
                  cardBase,
                  "mt-4 divide-y divide-front-line overflow-hidden"
                )}
              >
                {teachers.map((teacher, index) => (
                  <TeacherCard
                    key={teacher.id}
                    teacher={teacher}
                    index={index}
                    freeSlots={freeSlots[teacher.id] ?? 0}
                  />
                ))}
              </div>
            ) : (
              <div className={cn(cardBase, "mt-4 p-6")}>
                <p className="font-semibold">
                  Nikt nie prowadzi teraz tego przedmiotu
                </p>
                <p className="mt-2 max-w-[52ch] leading-relaxed text-front-muted">
                  Napisz, czego potrzebujesz — jeśli szukamy nauczyciela do tego
                  przedmiotu, powiemy wprost, zamiast trzymać zgłoszenie
                  w zawieszeniu.
                </p>
                <Link
                  href={`/kontakt?przedmiot=${subject.slug}`}
                  className={cn(btnSecondary, "mt-5")}
                >
                  <MessageCircle />
                  Napisz do nas
                </Link>
              </div>
            )}

            {subjectFaq.length > 0 && (
              <>
                <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
                  Pytania o {subject.name.toLowerCase()}
                </h2>
                <div className="mt-4">
                  <FaqList items={subjectFaq} />
                </div>
              </>
            )}

            {reviews.length > 0 && (
              <>
                <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
                  Opinie
                </h2>
                <div className="mt-4 grid gap-4">
                  {reviews.map((review) => (
                    <figure key={review.id} className={cn(cardBase, "p-5")}>
                      <blockquote className="leading-relaxed">
                        {review.content}
                      </blockquote>
                      <figcaption className="mt-3 text-sm font-semibold text-front-muted">
                        {review.authorName}
                        {review.teacher ? ` · ${review.teacher.name}` : ""}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <Link
                  href="/opinie"
                  className="mt-4 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
                >
                  Wszystkie opinie
                  <ArrowRight className="size-4.5" />
                </Link>
              </>
            )}
          </div>

          <div className="lg:sticky lg:top-24">
            <SlotPicker
              board={board}
              subjects={[
                { id: subject.id, name: subject.name, slug: subject.slug },
              ]}
              levels={levels}
              initialSubjectId={subject.id}
              currency={settings.currency}
              note={
                board.slots.length > 0
                  ? `${board.slots.length} ${plural(board.slots.length, "wolna godzina", "wolne godziny", "wolnych godzin")} w najbliższych ${HORIZON_DAYS} dniach`
                  : "Brak wolnych godzin w tym przedmiocie — napisz, a poszukamy terminu."
              }
            />
          </div>
        </div>
      </section>
    </>
  )
}
