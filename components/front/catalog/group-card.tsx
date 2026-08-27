import { ArrowRight, CalendarClock, CircleCheck, Users } from "lucide-react"
import Link from "next/link"

import { cardBase, chip } from "@/components/front/styles"
import { formatPrice, plural, WEEKDAYS } from "@/lib/format"
import type { GroupWithSeats } from "@/lib/public/groups"
import { cn } from "@/lib/utils"

/**
 * Karta zajęć grupowych. Liczba wolnych miejsc jest liczona przy każdym
 * żądaniu — grupa, do której nie da się już zapisać, mówi to wprost i oferuje
 * listę rezerwową zamiast udawać, że miejsce jest.
 */
export function GroupCard({
  group,
  currency,
  discountPercent,
}: {
  group: GroupWithSeats
  currency: string
  discountPercent?: number
}) {
  const weekday = WEEKDAYS.find((day) => day.value === group.weekday)
  const full = group.seatsLeft === 0

  return (
    <article className={cn(cardBase, "flex flex-col p-6 sm:p-8")}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl font-semibold tracking-tight">
          <Link
            href={`/grupy/${group.slug}`}
            className="transition-colors hover:text-front-brand"
          >
            {group.name}
          </Link>
        </h3>
        <p className="whitespace-nowrap">
          <span className="font-display text-3xl font-semibold">
            {formatPrice(group.pricePerMonth, currency)}
          </span>
          <span className="ml-1 font-semibold text-front-muted">/ mies.</span>
        </p>
      </div>

      <p className="mt-1 font-semibold text-front-muted">
        {group.meetingsPerMonth} {plural(group.meetingsPerMonth, "spotkanie", "spotkania", "spotkań")}{" "}
        × {group.meetingMinutes} min w miesiącu
        {group.hourlyEquivalent
          ? ` · ${formatPrice(group.hourlyEquivalent, currency)}/h`
          : ""}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className={cn(chip, "bg-front-ground text-front-muted")}>
          <CalendarClock className="size-4" />
          {weekday?.label ?? "termin do ustalenia"}, {group.startTime}
        </span>
        {group.level && (
          <span className={cn(chip, "bg-front-ground text-front-muted")}>
            {group.level.name}
          </span>
        )}
        {group.subject && (
          <span className={cn(chip, "bg-front-ground text-front-muted")}>
            {group.subject.name}
          </span>
        )}
      </div>

      {group.description && (
        <p className="mt-4 max-w-[60ch] flex-1 leading-relaxed text-front-muted">
          {group.description}
        </p>
      )}

      <ul className="mt-5 space-y-2.5">
        <li className="flex items-start gap-2.5">
          <Users
            className={cn(
              "mt-0.5 size-5 shrink-0",
              full ? "text-front-sun" : "text-front-mint"
            )}
          />
          <span className={full ? "font-semibold" : "text-front-muted"}>
            {full
              ? "Komplet — zapis wchodzi na listę rezerwową"
              : `${group.seatsLeft} ${plural(group.seatsLeft, "wolne miejsce", "wolne miejsca", "wolnych miejsc")} z ${group.maxSeats}`}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-front-mint" />
          <span className="text-front-muted">
            Prowadzi {group.teacher.name}
          </span>
        </li>
        {discountPercent ? (
          <li className="flex items-start gap-2.5">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-front-mint" />
            <span className="text-front-muted">
              {discountPercent}% taniej, jeśli masz u nas zajęcia indywidualne
            </span>
          </li>
        ) : null}
      </ul>

      <Link
        href={`/grupy/${group.slug}`}
        className="mt-6 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
      >
        {full ? "Zapisz się na listę rezerwową" : "Zapisz się do grupy"}
        <ArrowRight className="size-4.5" />
      </Link>
    </article>
  )
}
