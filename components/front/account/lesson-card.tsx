import { Clock3, MapPin, User } from "lucide-react"
import Link from "next/link"

import { BookingStatusChip } from "@/components/front/status-chip"
import { cardBase } from "@/components/front/styles"
import { formatLongDate, formatPrice, formatTime } from "@/lib/format"
import type { BookingStatus, LocationType } from "@/lib/generated/prisma/enums"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type AccountLesson = {
  id: string
  reference: string
  status: BookingStatus
  startsAt: Date
  endsAt: Date
  price: number | null
  mode: LocationType
  teacherName: string
  teacherSlug: string
  subjectName: string | null
  levelName: string | null
  locationName: string | null
  locationCity: string | null
  statusReason: string | null
}

/**
 * Lekcja na koncie ucznia. Szczegóły i odwołanie mieszkają pod kodem
 * (`/rezerwacja/[kod]`) — ta sama strona, którą uczeń dostaje przy zapisie,
 * żeby nie było dwóch miejsc mówiących o jednej rezerwacji.
 */
export function LessonCard({
  lesson,
  currency,
  children,
}: {
  lesson: AccountLesson
  currency: string
  children?: React.ReactNode
}) {
  return (
    <article className={cn(cardBase, "p-5 sm:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight font-semibold">
            {formatLongDate(lesson.startsAt)}, {formatTime(lesson.startsAt)}
          </p>
          <ul className="mt-2 grid gap-1.5 font-body text-sm text-front-muted">
            <li className="flex items-center gap-2">
              <User className="size-4 shrink-0" />
              <Link
                href={`/nauczyciele/${lesson.teacherSlug}`}
                className="font-semibold text-front-ink transition-colors hover:text-front-brand"
              >
                {lesson.teacherName}
              </Link>
              {[lesson.subjectName, lesson.levelName]
                .filter(Boolean)
                .map((part) => ` · ${part}`)
                .join("")}
            </li>
            <li className="flex items-center gap-2">
              <Clock3 className="size-4 shrink-0" />
              {Math.round(
                (lesson.endsAt.getTime() - lesson.startsAt.getTime()) / 60_000
              )}{" "}
              min
              {lesson.price !== null &&
                ` · ${formatPrice(lesson.price, currency)}`}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {[
                lesson.locationName,
                LOCATION_TYPE_LABELS[lesson.mode],
                lesson.locationCity,
              ]
                .filter(Boolean)
                .join(" · ")}
            </li>
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <BookingStatusChip status={lesson.status} />
          <Link
            href={`/rezerwacja/${lesson.reference}`}
            className="font-body text-sm font-bold text-front-brand hover:underline"
          >
            Szczegóły
          </Link>
        </div>
      </div>

      {lesson.statusReason && (
        <p className="mt-3 border-t border-front-line pt-3 font-body text-sm text-front-muted">
          {lesson.statusReason}
        </p>
      )}

      {children && (
        <div className="mt-4 border-t border-front-line pt-4">{children}</div>
      )}
    </article>
  )
}
