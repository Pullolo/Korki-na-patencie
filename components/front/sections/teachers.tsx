import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { TeacherCard } from "@/components/front/catalog/teacher-card"
import { cardBase } from "@/components/front/styles"
import type { PublicTeacher } from "@/lib/public/teachers"
import { cn } from "@/lib/utils"

/**
 * Nauczyciele na landingu — trzy pierwsze profile z panelu, w kolejności
 * ustawionej przez admina. Reszta czeka na `/nauczyciele`.
 */
export function TeachersSection({
  teachers,
  freeSlots,
}: {
  teachers: PublicTeacher[]
  freeSlots: Record<string, number>
}) {
  if (teachers.length === 0) return null

  return (
    <section id="nauczyciele" className="bg-front-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <h2 className="max-w-[16ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          Ludzie, którzy będą uczyć
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-front-muted">
          Każdy profil ma własny grafik, własne miejsca zajęć i własne opinie.
          Godziny przy nazwisku to te, które są wolne w najbliższych dniach.
        </p>

        <div
          className={cn(
            cardBase,
            "mt-10 divide-y divide-front-line overflow-hidden"
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

        <Link
          href="/nauczyciele"
          className="mt-8 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
        >
          Wszyscy nauczyciele
          <ArrowRight className="size-4.5" />
        </Link>
      </div>
    </section>
  )
}
