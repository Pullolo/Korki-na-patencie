import { GraduationCap, MapPin, Star } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Avatar } from "@/components/front/avatar"
import { JsonLd } from "@/components/front/json-ld"
import { SlotPicker } from "@/components/front/booking/slot-picker"
import { PageHero } from "@/components/front/layout/page-hero"
import { cardBase, chip } from "@/components/front/styles"
import { formatPrice, plural } from "@/lib/format"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import { resolveHourlyPrice } from "@/lib/pricing"
import { getTeacherDays } from "@/lib/public/availability"
import { listLevels } from "@/lib/public/levels"
import { getPriceRules } from "@/lib/public/pricing"
import { averageRating, listReviews } from "@/lib/public/reviews"
import { getSiteSettings } from "@/lib/public/settings"
import { getTeacher } from "@/lib/public/teachers"
import { absoluteUrl, pageMetadata, seoDescription } from "@/lib/seo"
import { cn } from "@/lib/utils"

/** Grafik na profilu pokazujemy na dwa tygodnie do przodu. */
const HORIZON_DAYS = 14

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const teacher = await getTeacher(slug)
  if (!teacher) return { title: "Nie znaleziono nauczyciela" }

  const subjects = teacher.subjects.map((subject) => subject.name).join(", ")
  return pageMetadata({
    title: teacher.seoTitle || teacher.name,
    description: seoDescription(
      teacher.seoDescription || teacher.headline || teacher.bio,
      `${teacher.name} — korepetycje: ${subjects || "zajęcia indywidualne"}. Sprawdź wolne terminy i zapisz się online.`
    ),
    path: `/nauczyciele/${teacher.slug}`,
    image: teacher.imageUrl,
  })
}

export default async function TeacherPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const teacher = await getTeacher(slug)
  if (!teacher) notFound()

  const [settings, levels, priceRules, reviews, board] = await Promise.all([
    getSiteSettings(),
    listLevels(),
    getPriceRules(),
    listReviews({ teacherProfileId: teacher.id }),
    getTeacherDays(teacher.id, { days: HORIZON_DAYS }),
  ])

  const rating = averageRating(reviews)

  // Cennik tego nauczyciela: tylko kombinacje, które faktycznie prowadzi.
  const priceRows = teacher.subjects.flatMap((subject) =>
    subject.levels
      .map((level) => ({
        subject: subject.name,
        level: level.name,
        pricePerHour: resolveHourlyPrice(priceRules, {
          subjectId: subject.id,
          levelId: level.id,
          teacherProfileId: teacher.id,
        }),
      }))
      .filter((row) => row.pricePerHour !== null)
  )

  const pickerSubjects = teacher.subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    slug: subject.slug,
  }))

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: teacher.name,
    url: absoluteUrl(`/nauczyciele/${teacher.slug}`),
    ...(teacher.headline ? { jobTitle: teacher.headline } : {}),
    ...(teacher.bio ? { description: teacher.bio } : {}),
    ...(teacher.imageUrl ? { image: teacher.imageUrl } : {}),
    knowsAbout: teacher.subjects.map((subject) => subject.name),
    worksFor: { "@type": "EducationalOrganization", name: settings.siteName },
  }

  return (
    <>
      <JsonLd data={person} />
      <PageHero
        crumbs={[
          { label: "Nauczyciele", href: "/nauczyciele" },
          { label: teacher.name },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-5">
            <Avatar name={teacher.name} imageUrl={teacher.imageUrl} size={72} />
            {teacher.name}
          </span>
        }
        lead={teacher.headline}
      >
        <div className="flex flex-wrap items-center gap-2">
          {teacher.subjects.map((subject) => (
            <span
              key={subject.id}
              className={cn(chip, "bg-front-surface text-front-ink")}
            >
              {subject.name}
            </span>
          ))}
          {teacher.experienceYears ? (
            <span className={cn(chip, "bg-front-surface text-front-muted")}>
              {teacher.experienceYears}{" "}
              {plural(teacher.experienceYears, "rok", "lata", "lat")}{" "}
              doświadczenia
            </span>
          ) : null}
          {rating !== null && (
            <span className={cn(chip, "bg-front-sun-soft text-front-sun")}>
              <Star className="size-4 fill-current" />
              {rating.toFixed(1).replace(".", ",")} ({reviews.length})
            </span>
          )}
          {!teacher.isAcceptingStudents && (
            <span className={cn(chip, "bg-front-coral-soft text-front-coral")}>
              nie przyjmuje teraz nowych uczniów
            </span>
          )}
        </div>
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14">
          <div className="min-w-0">
            {teacher.bio && (
              <>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  O mnie
                </h2>
                <p className="mt-3 max-w-[68ch] leading-relaxed whitespace-pre-line text-front-muted">
                  {teacher.bio}
                </p>
              </>
            )}

            {teacher.education && (
              <p className="mt-6 flex items-start gap-2.5 text-front-muted">
                <GraduationCap className="mt-0.5 size-5 shrink-0 text-front-brand" />
                {teacher.education}
              </p>
            )}

            <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
              Przedmioty i poziomy
            </h2>
            <div
              className={cn(
                cardBase,
                "mt-4 divide-y divide-front-line overflow-hidden"
              )}
            >
              {teacher.subjects.map((subject) => (
                <div key={subject.id} className="p-5 sm:px-6">
                  <h3 className="font-display text-lg font-semibold">
                    {subject.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {subject.levels.map((level) => (
                      <span
                        key={level.id}
                        className={cn(chip, "bg-front-ground text-front-muted")}
                      >
                        {level.name}
                      </span>
                    ))}
                  </div>
                  {subject.note && (
                    <p className="mt-2 max-w-[60ch] leading-relaxed text-front-muted">
                      {subject.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {priceRows.length > 0 && (
              <>
                <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
                  Cennik
                </h2>
                <div
                  className={cn(
                    cardBase,
                    "mt-4 divide-y divide-front-line overflow-hidden"
                  )}
                >
                  {priceRows.map((row) => (
                    <div
                      key={`${row.subject}-${row.level}`}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6"
                    >
                      <span className="min-w-0 font-semibold">
                        {row.subject}
                        <span className="text-front-muted">
                          {" "}
                          · {row.level}
                        </span>
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
              </>
            )}

            {teacher.locations.length > 0 && (
              <>
                <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
                  Gdzie odbywają się zajęcia
                </h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {teacher.locations.map((location) => (
                    <li
                      key={location.id}
                      className={cn(cardBase, "p-5")}
                    >
                      <p className="flex items-center gap-2 font-semibold">
                        <MapPin className="size-4.5 shrink-0 text-front-brand" />
                        {location.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-front-muted">
                        {LOCATION_TYPE_LABELS[location.type]}
                        {location.city ? ` · ${location.city}` : ""}
                      </p>
                      {location.note && (
                        <p className="mt-2 text-sm leading-relaxed text-front-muted">
                          {location.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {reviews.length > 0 && (
              <>
                <h2 className="mt-10 font-display text-2xl font-semibold tracking-tight">
                  Opinie
                </h2>
                <div className="mt-4 grid gap-4">
                  {reviews.slice(0, 5).map((review) => (
                    <figure key={review.id} className={cn(cardBase, "p-5")}>
                      <div aria-hidden className="flex gap-0.5 text-front-sun">
                        {Array.from({ length: 5 }).map((_, position) => (
                          <Star
                            key={position}
                            className={cn(
                              "size-4",
                              position < review.rating
                                ? "fill-current"
                                : "text-front-line-strong"
                            )}
                          />
                        ))}
                      </div>
                      <blockquote className="mt-3 leading-relaxed">
                        {review.content}
                      </blockquote>
                      <figcaption className="mt-3 text-sm font-semibold text-front-muted">
                        {review.authorName}
                        {review.subject ? ` · ${review.subject.name}` : ""}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lg:sticky lg:top-24">
            <SlotPicker
              board={board}
              subjects={pickerSubjects}
              levels={levels}
              currency={settings.currency}
              note={
                board.slots.length > 0
                  ? `${board.slots.length} ${plural(board.slots.length, "wolna godzina", "wolne godziny", "wolnych godzin")} w najbliższych ${HORIZON_DAYS} dniach`
                  : `Brak wolnych godzin w najbliższych ${HORIZON_DAYS} dniach — napisz, a poszukamy terminu.`
              }
            />
          </div>
        </div>
      </section>
    </>
  )
}
