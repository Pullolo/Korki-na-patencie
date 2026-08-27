import { ArrowRight, CalendarClock, CircleCheck, Users, Wallet } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { GroupCard } from "@/components/front/catalog/group-card"
import { PageHero } from "@/components/front/layout/page-hero"
import { FaqList } from "@/components/front/sections/faq"
import { btnPrimary, cardBase } from "@/components/front/styles"
import { formatPrice, plural } from "@/lib/format"
import { listFaq } from "@/lib/public/faq"
import { listGroups } from "@/lib/public/groups"
import { listLevels } from "@/lib/public/levels"
import { getPriceTable } from "@/lib/public/pricing"
import { getSiteSettings } from "@/lib/public/settings"
import { pageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const levels = await listLevels()
  const table = await getPriceTable(levels)
  const prices = table
    .map((row) => row.pricePerHour)
    .filter((price): price is number => price !== null)

  return pageMetadata({
    title: "Cennik",
    description:
      prices.length > 0
        ? `Korepetycje od ${Math.min(...prices)} do ${Math.max(...prices)} ${settings.currency} za godzinę zegarową. Płatność po lekcji, odwołanie do ${settings.bookingMinLeadHours} h przed terminem.`
        : "Stawki za godzinę zegarową, zajęcia grupowe i zasady rezerwacji.",
    path: "/cennik",
  })
}

export default async function PricingPage() {
  const [settings, levels, groups, faq] = await Promise.all([
    getSiteSettings(),
    listLevels(),
    listGroups(),
    listFaq(),
  ])

  const table = (await getPriceTable(levels)).filter(
    (row) => row.pricePerHour !== null
  )

  const rules = [
    {
      icon: Wallet,
      title: "Płacisz po lekcji",
      description:
        "Gotówką albo przelewem, po zajęciach. Nie sprzedajemy pakietów i nie pobieramy zaliczek.",
    },
    {
      icon: CalendarClock,
      title: `Odwołanie do ${settings.bookingMinLeadHours} h przed`,
      description: `Do ${settings.bookingMinLeadHours} godzin przed terminem odwołanie nic nie kosztuje. Później termin przepada, bo zwykle nie da się wstawić w to miejsce nikogo innego.`,
    },
    {
      icon: CircleCheck,
      title: settings.bookingAutoConfirm
        ? "Rezerwacja od razu potwierdzona"
        : "Potwierdzamy ręcznie",
      description: settings.bookingAutoConfirm
        ? "Wybrany termin blokuje się od razu po wysłaniu zgłoszenia."
        : `Zgłoszenie trafia do nauczyciela i wraca z potwierdzeniem. Rezerwować można najdalej na ${settings.bookingMaxAdvanceDays} ${plural(settings.bookingMaxAdvanceDays, "dzień", "dni", "dni")} do przodu.`,
    },
  ]

  const paymentFaq = faq.filter((item) =>
    ["płatności", "rezerwacje"].includes(item.category?.toLowerCase() ?? "")
  )

  return (
    <>
      <PageHero
        crumbs={[{ label: "Cennik" }]}
        title="Cena zależy od poziomu, nie od tego, jak pilne"
        lead="Jedna stawka za godzinę zegarową — online i stacjonarnie tak samo. Zajęcia grupowe rozliczamy miesięcznie."
      />

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Zajęcia indywidualne
          </h2>

          {table.length > 0 ? (
            <div
              className={cn(
                cardBase,
                "mt-6 divide-y divide-front-line overflow-hidden"
              )}
            >
              {table.map((row) => (
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
                      {formatPrice(row.pricePerHour, settings.currency)}
                    </span>
                    <span className="ml-1 font-semibold text-front-muted">
                      / 60 min
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 max-w-[60ch] leading-relaxed text-front-muted">
              Cennik jest w przygotowaniu — napisz do nas, a podamy stawkę dla
              konkretnego przedmiotu i poziomu.
            </p>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {rules.map((rule) => (
              <div key={rule.title} className={cn(cardBase, "p-6")}>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-front-brand-soft text-front-brand">
                  <rule.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {rule.title}
                </h3>
                <p className="mt-1.5 leading-relaxed text-front-muted">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {groups.length > 0 && (
        <section className="bg-front-ground">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Zajęcia grupowe
            </h2>
            <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-front-muted">
              Stały termin w tygodniu, mała grupa i rozliczenie miesięczne —
              niezależnie od tego, ile spotkań wypadnie w kalendarzu.
            </p>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  currency={settings.currency}
                  discountPercent={settings.groupDiscountPercent}
                />
              ))}
            </div>

            {settings.groupDiscountPercent > 0 && (
              <p className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-front-sun-soft px-5 py-4 font-semibold text-front-ink">
                <Users className="size-5 text-front-sun" />
                Uczysz się u nas indywidualnie? Zajęcia grupowe masz{" "}
                {settings.groupDiscountPercent}% taniej — rabat naliczamy przy
                zapisie.
              </p>
            )}
          </div>
        </section>
      )}

      {paymentFaq.length > 0 && (
        <section className="bg-front-surface">
          <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Płatności i rezerwacje
            </h2>
            <div className="mt-6">
              <FaqList items={paymentFaq} />
            </div>
          </div>
        </section>
      )}

      <section className="bg-front-ground">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="mx-auto max-w-[20ch] font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Cenę już znasz. Zostaje wybrać godzinę
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/terminy" className={btnPrimary}>
              Zobacz wolne terminy
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
