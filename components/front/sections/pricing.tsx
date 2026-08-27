import { ArrowRight, Users } from "lucide-react"
import Link from "next/link"

import { GroupCard } from "@/components/front/catalog/group-card"
import { Marker } from "@/components/front/marker"
import { cardBase } from "@/components/front/styles"
import { formatPrice } from "@/lib/format"
import type { GroupWithSeats } from "@/lib/public/groups"
import { cn } from "@/lib/utils"

export type PriceRow = {
  level: { id: string; name: string; slug: string }
  pricePerHour: number | null
  note: string | null
}

/**
 * Cennik na landingu: stawka za godzinę zegarową według poziomu plus grupy.
 * Kwoty pochodzą wyłącznie z `PriceRule` — żadna z nich nie jest liczona
 * w komponencie (`docs/FRONTEND.md`, zasada 3).
 */
export function PricingSection({
  rows,
  groups,
  discountPercent,
  currency,
}: {
  rows: PriceRow[]
  groups: GroupWithSeats[]
  discountPercent: number
  currency: string
}) {
  const priced = rows.filter((row) => row.pricePerHour !== null)
  if (priced.length === 0 && groups.length === 0) return null

  return (
    <section id="cennik" className="bg-front-ground">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <h2 className="max-w-[20ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          Cena zależy{" "}
          <span className="whitespace-nowrap">
            <Marker tone="bg-front-sky-soft">od poziomu</Marker>,
          </span>{" "}
          nie od tego, jak pilne
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-front-muted">
          Jedna stawka za godzinę zegarową — online i stacjonarnie tak samo.
          Płatność po lekcji.
        </p>

        {priced.length > 0 && (
          <div
            className={cn(
              cardBase,
              "mt-12 divide-y divide-front-line overflow-hidden"
            )}
          >
            {priced.map((row) => (
              <div
                key={row.level.id}
                className="flex flex-wrap items-center justify-between gap-4 p-6 sm:px-8"
              >
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">
                    {row.level.name}
                  </h3>
                  {row.note && (
                    <p className="mt-1 max-w-[52ch] leading-relaxed text-front-muted">
                      {row.note}
                    </p>
                  )}
                </div>
                <p className="shrink-0 whitespace-nowrap">
                  <span className="font-display text-3xl font-semibold">
                    {formatPrice(row.pricePerHour, currency)}
                  </span>
                  <span className="ml-1 font-semibold text-front-muted">
                    / 60 min
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}

        {groups.length > 0 && (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {groups.slice(0, 2).map((group) => (
              <GroupCard key={group.id} group={group} currency={currency} />
            ))}
          </div>
        )}

        {discountPercent > 0 && (
          <p className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-front-sun-soft px-5 py-4 font-semibold text-front-ink">
            <Users className="size-5 text-front-sun" />
            Uczysz się u nas indywidualnie? Zajęcia grupowe masz{" "}
            {discountPercent}% taniej — rabat naliczamy przy zapisie.
          </p>
        )}

        <Link
          href="/cennik"
          className="mt-8 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
        >
          Pełny cennik i zasady rezerwacji
          <ArrowRight className="size-4.5" />
        </Link>
      </div>
    </section>
  )
}
