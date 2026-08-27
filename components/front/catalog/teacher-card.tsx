import { ArrowRight, Clock3, MapPin } from "lucide-react"
import Link from "next/link"

import { Avatar } from "@/components/front/avatar"
import { chip } from "@/components/front/styles"
import { subjectTone } from "@/components/front/subject-tone"
import { plural } from "@/lib/format"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import type { PublicTeacher } from "@/lib/public/teachers"
import { cn } from "@/lib/utils"

/**
 * Wiersz nauczyciela w liście dzielonej (`DESIGN.md`, Shapes: porównywalne
 * pozycje leżą w jednym pudełku, nie w trzech kartach).
 *
 * Liczba wolnych godzin jest policzona przy tym żądaniu — dlatego wchodzi
 * propsem, a nie zapytaniem z wnętrza komponentu.
 */
export function TeacherCard({
  teacher,
  freeSlots,
  index = 0,
}: {
  teacher: PublicTeacher
  freeSlots?: number
  index?: number
}) {
  const tone = subjectTone(index)
  const modes = [...new Set(teacher.locations.map((location) => location.type))]
  const cities = [
    ...new Set(
      teacher.locations
        .map((location) => location.city)
        .filter((city): city is string => Boolean(city))
    ),
  ]

  return (
    <article className="p-6 transition-colors hover:bg-front-ground/60 sm:px-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Avatar
          name={teacher.name}
          imageUrl={teacher.imageUrl}
          tone={tone.soft}
        />

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold tracking-tight">
            <Link
              href={`/nauczyciele/${teacher.slug}`}
              className="transition-colors hover:text-front-brand"
            >
              {teacher.name}
            </Link>
          </h3>
          <p className="text-sm font-semibold text-front-muted">
            {teacher.subjects.map((subject) => subject.name).join(" · ") ||
              "Przedmioty w przygotowaniu"}
          </p>
        </div>

        <p className="flex w-full shrink-0 items-center gap-2 font-semibold whitespace-nowrap sm:w-auto">
          {freeSlots === undefined ? null : freeSlots > 0 ? (
            <>
              <Clock3 className="size-5 text-front-mint" />
              {freeSlots}{" "}
              {plural(freeSlots, "wolna godzina", "wolne godziny", "wolnych godzin")}
            </>
          ) : (
            <>
              <Clock3 className="size-5 text-front-muted" />
              <span className="text-front-muted">brak wolnych godzin</span>
            </>
          )}
        </p>
      </div>

      {(teacher.headline || teacher.bio) && (
        <p className="mt-3 max-w-[68ch] leading-relaxed text-front-muted sm:pl-19">
          {teacher.headline ?? teacher.bio}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:pl-19">
        {modes.map((mode) => (
          <span
            key={mode}
            className={cn(chip, "bg-front-ground text-front-muted")}
          >
            {LOCATION_TYPE_LABELS[mode]}
          </span>
        ))}
        {cities.length > 0 && (
          <span className={cn(chip, "bg-front-ground text-front-muted")}>
            <MapPin className="size-4" />
            {cities.join(", ")}
          </span>
        )}
        {!teacher.isAcceptingStudents && (
          <span className={cn(chip, "bg-front-sun-soft text-front-sun")}>
            nie przyjmuje nowych uczniów
          </span>
        )}
        <Link
          href={`/nauczyciele/${teacher.slug}`}
          className="ml-auto inline-flex items-center gap-1.5 font-semibold text-front-brand hover:underline"
        >
          Profil i grafik
          <ArrowRight className="size-4.5" />
        </Link>
      </div>
    </article>
  )
}
