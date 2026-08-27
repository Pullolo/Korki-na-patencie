import { ArrowRight, Star } from "lucide-react"
import Link from "next/link"

import { cardBase } from "@/components/front/styles"
import { subjectTone } from "@/components/front/subject-tone"
import type { PublicReview } from "@/lib/public/reviews"
import { cn } from "@/lib/utils"

const TILTS = ["-rotate-1", "rotate-[0.7deg] md:mt-8", "-rotate-[0.5deg] md:mt-16"]

/**
 * Opinie jako rozsypane karteczki (`DESIGN.md`, Shapes). Wypowiedź to
 * karteczka, nie wiersz tabeli — dlatego obrót i schodkowanie.
 *
 * Sekcja znika, gdy nie ma ani jednej zatwierdzonej opinii. Pusta ramka
 * z napisem „brak opinii" nie sprzedaje niczego, a `PRODUCT.md` zabrania
 * podpierania się dowodami, których nie ma.
 */
export function ReviewsSection({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) return null

  return (
    <section className="bg-[var(--front-band-warm)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <h2 className="max-w-[16ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          Co mówią uczniowie i rodzice
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-front-muted">
          Opinie wystawiają uczniowie po odbytej lekcji. Publikujemy je po
          przejrzeniu, bez skracania i bez poprawiania.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-start">
          {reviews.slice(0, 3).map((review, index) => (
            <figure
              key={review.id}
              className={cn(cardBase, "flex flex-col p-6", TILTS[index % 3])}
            >
              <div
                aria-hidden
                className="flex gap-0.5 text-front-sun"
                title={`Ocena ${review.rating} na 5`}
              >
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
              <blockquote className="mt-4 flex-1 text-lg leading-relaxed">
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
                <span>
                  <span className="block font-semibold">
                    {review.authorName}
                  </span>
                  <span className="block text-sm text-front-muted">
                    {[review.subject?.name, review.teacher?.name]
                      .filter(Boolean)
                      .join(" · ") || "opinia ucznia"}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <Link
          href="/opinie"
          className="mt-10 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
        >
          Wszystkie opinie
          <ArrowRight className="size-4.5" />
        </Link>
      </div>
    </section>
  )
}
