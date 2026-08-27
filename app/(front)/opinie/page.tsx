import { ArrowRight, Star } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import type { FilterGroup } from "@/components/front/catalog/filter-bar"
import { FilterBar } from "@/components/front/catalog/filter-bar"
import { PageHero } from "@/components/front/layout/page-hero"
import { btnSecondary, cardBase } from "@/components/front/styles"
import { subjectTone } from "@/components/front/subject-tone"
import { formatDate, plural } from "@/lib/format"
import { firstParam } from "@/lib/public/modes"
import { averageRating, listReviews } from "@/lib/public/reviews"
import { listSubjects } from "@/lib/public/subjects"
import { listTeachers } from "@/lib/public/teachers"
import { pageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

type SearchParams = {
  nauczyciel?: string | string[]
  przedmiot?: string | string[]
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Opinie",
    description:
      "Co mówią uczniowie i rodzice po odbytych lekcjach. Opinie wystawiają uczniowie na swoim koncie, publikujemy je po przeczytaniu.",
    path: "/opinie",
  })
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const teacherSlug = firstParam(params.nauczyciel)
  const subjectSlug = firstParam(params.przedmiot)

  const [teachers, subjects] = await Promise.all([
    listTeachers(),
    listSubjects(),
  ])

  const teacher = teachers.find((item) => item.slug === teacherSlug) ?? null
  const subject = subjects.find((item) => item.slug === subjectSlug) ?? null

  const reviews = await listReviews({
    teacherProfileId: teacher?.id ?? null,
    subjectId: subject?.id ?? null,
    limit: 60,
  })

  const rating = averageRating(reviews)

  const groups: FilterGroup[] = [
    {
      key: "nauczyciel",
      label: "Nauczyciel",
      options: teachers.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    },
    {
      key: "przedmiot",
      label: "Przedmiot",
      options: subjects.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    },
  ]

  return (
    <>
      <PageHero
        crumbs={[{ label: "Opinie" }]}
        title="Co mówią uczniowie i rodzice"
        lead="Opinie wystawiają uczniowie na swoim koncie, po odbytej lekcji. Publikujemy je po przeczytaniu — bez skracania i bez poprawiania."
      >
        <FilterBar
          basePath="/opinie"
          params={{ nauczyciel: teacherSlug, przedmiot: subjectSlug }}
          groups={groups}
          resultLabel={
            rating === null
              ? undefined
              : `${reviews.length} ${plural(reviews.length, "opinia", "opinie", "opinii")} · średnia ${rating.toFixed(1).replace(".", ",")} / 5`
          }
        />
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
          {reviews.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {reviews.map((review, index) => (
                <figure key={review.id} className={cn(cardBase, "flex flex-col p-6")}>
                  <div aria-hidden className="flex gap-0.5 text-front-sun">
                    {Array.from({ length: 5 }).map((_, position) => (
                      <Star
                        key={position}
                        className={cn(
                          "size-4.5",
                          position < review.rating
                            ? "fill-current"
                            : "text-front-line-strong"
                        )}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 leading-relaxed">
                    {review.content}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-front-line pt-4">
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl font-display font-semibold",
                        subjectTone(index).soft
                      )}
                    >
                      {review.authorName.trim()[0]?.toUpperCase() ?? "?"}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {review.authorName}
                      </span>
                      <span className="block text-sm text-front-muted">
                        {[
                          review.subject?.name,
                          review.teacher ? (
                            <Link
                              key="teacher"
                              href={`/nauczyciele/${review.teacher.slug}`}
                              className="hover:text-front-brand hover:underline"
                            >
                              {review.teacher.name}
                            </Link>
                          ) : null,
                        ]
                          .filter(Boolean)
                          .map((part, position) => (
                            <span key={position}>
                              {position > 0 ? " · " : ""}
                              {part}
                            </span>
                          ))}
                        {review.publishedAt && (
                          <span className="block">
                            {formatDate(review.publishedAt)}
                          </span>
                        )}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className={cn(cardBase, "p-8 text-center sm:p-12")}>
              <h2 className="font-display text-2xl font-semibold">
                {teacher || subject
                  ? "Przy tym wyborze nie ma jeszcze opinii"
                  : "Nie mamy jeszcze ani jednej opinii"}
              </h2>
              <p className="mx-auto mt-2 max-w-[52ch] leading-relaxed text-front-muted">
                Nie wymyślamy ich ani nie prosimy o nie znajomych. Pierwsza
                pojawi się tutaj, gdy wystawi ją uczeń po odbytej lekcji.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {(teacher || subject) && (
                  <Link href="/opinie" className={btnSecondary}>
                    Pokaż wszystkie
                  </Link>
                )}
                <Link href="/terminy" className={btnSecondary}>
                  Zobacz wolne terminy
                  <ArrowRight />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
