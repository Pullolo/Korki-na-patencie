import { ArrowRight } from "lucide-react"
import Link from "next/link"

import type { SubjectCardData } from "@/components/front/catalog/subject-card"
import { SubjectCard } from "@/components/front/catalog/subject-card"
import { Marker } from "@/components/front/marker"
import { plural } from "@/lib/format"

export type { SubjectCardData }

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
          {subjects.map((subject, index) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              index={index}
              currency={currency}
            />
          ))}
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
