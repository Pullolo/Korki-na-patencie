import { ArrowRight } from "lucide-react"
import Link from "next/link"

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
 * Karta przedmiotu — ta sama na landingu i w katalogu. Cała karta jest
 * linkiem: na telefonie cel dotykowy ma wtedy sens, a nie sprowadza się
 * do jednego słowa na dole.
 */
export function SubjectCard({
  subject,
  index = 0,
  currency,
  showTeacherCount = false,
}: {
  subject: SubjectCardData
  index?: number
  currency: string
  showTeacherCount?: boolean
}) {
  const tone = subjectTone(index)

  return (
    <Link
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

      {showTeacherCount && (
        <p className="mt-3 font-body text-sm font-semibold text-front-muted">
          {subject.teacherCount > 0
            ? `${subject.teacherCount} ${plural(subject.teacherCount, "nauczyciel", "nauczycieli", "nauczycieli")}`
            : "szukamy nauczyciela"}
        </p>
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
}
