import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Marker } from "@/components/front/marker"
import { cardBase, chip } from "@/components/front/styles"
import { SubjectIcon } from "@/components/front/subject-icon"
import { subjectTone } from "@/components/front/subject-tone"
import { formatPrice, plural } from "@/lib/format"
import { cn } from "@/lib/utils"

export type SubjectCardData = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  levels: { id: string; name: string }[]
  fromPrice: number | null
  teacherCount: number
}

/**
 * Przedmioty na landingu. Karta prowadzi w podstronę przedmiotu — sekcja
 * zapowiada ofertę, nie zastępuje jej.
 */
export function SubjectsSection({
  subjects,
  currency,
}: {
  subjects: SubjectCardData[]
  currency: string
}) {
  if (subjects.length === 0) return null

  return (
    <section id="przedmioty" className="bg-front-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <h2 className="max-w-[20ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          {subjects.length}{" "}
          {plural(subjects.length, "przedmiot", "przedmioty", "przedmiotów")},
          w których jesteśmy{" "}
          <Marker tone="bg-front-mint-soft">naprawdę dobrzy</Marker>
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-front-muted">
          Nie bierzemy wszystkiego, co się nawinie. Za to w tych doprowadzamy
          ucznia do momentu, w którym przestaje nas potrzebować.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {subjects.map((subject, index) => {
            const tone = subjectTone(index)
            return (
              <Link
                key={subject.id}
                href={`/przedmioty/${subject.slug}`}
                className={cn(
                  cardBase,
                  "group flex flex-col p-6 transition-transform duration-200 hover:-translate-y-1"
                )}
              >
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    tone.soft
                  )}
                >
                  <SubjectIcon subject={subject} className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">
                  {subject.name}
                </h3>
                {subject.description && (
                  <p className="mt-2 flex-1 leading-relaxed text-front-muted">
                    {subject.description}
                  </p>
                )}
                {subject.levels.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {subject.levels.map((level) => (
                      <span
                        key={level.id}
                        className={cn(chip, "bg-front-ground text-front-muted")}
                      >
                        {level.name}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-5 flex items-center justify-between gap-3 border-t border-front-line pt-4 font-semibold">
                  {subject.fromPrice === null ? (
                    <span className="text-front-muted">cena do ustalenia</span>
                  ) : (
                    <span>
                      od{" "}
                      <span className="font-display text-2xl">
                        {formatPrice(subject.fromPrice, currency)}
                      </span>{" "}
                      <span className="text-front-muted">/ 60 min</span>
                    </span>
                  )}
                  <ArrowRight className="size-5 shrink-0 text-front-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-front-brand" />
                </p>
              </Link>
            )
          })}
        </div>

        <Link
          href="/przedmioty"
          className="mt-8 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
        >
          Wszystkie przedmioty i poziomy
          <ArrowRight className="size-4.5" />
        </Link>
      </div>
    </section>
  )
}
