import { ArrowRight, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { GroupCard } from "@/components/front/catalog/group-card"
import { PageHero } from "@/components/front/layout/page-hero"
import { btnSecondary, cardBase } from "@/components/front/styles"
import { listGroups } from "@/lib/public/groups"
import { getSiteSettings } from "@/lib/public/settings"
import { pageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Zajęcia grupowe",
    description:
      "Stały termin w tygodniu, mała grupa i rozliczenie miesięczne. Sprawdź wolne miejsca i zapisz się online.",
    path: "/grupy",
  })
}

export default async function GroupsPage() {
  const [settings, groups] = await Promise.all([
    getSiteSettings(),
    listGroups(),
  ])

  return (
    <>
      <PageHero
        crumbs={[{ label: "Grupy" }]}
        title="Zajęcia grupowe ze stałym terminem"
        lead="Mała grupa, jeden termin w tygodniu i rozliczenie miesięczne — niezależnie od tego, ile spotkań wypadnie w kalendarzu. Liczba wolnych miejsc jest sprawdzana na bieżąco."
      />

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          {groups.length > 0 ? (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
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
                  zapisie, jeśli jesteś zalogowany.
                </p>
              )}
            </>
          ) : (
            <div className={cn(cardBase, "p-8 text-center sm:p-12")}>
              <h2 className="font-display text-2xl font-semibold">
                Nie prowadzimy teraz żadnej grupy
              </h2>
              <p className="mx-auto mt-2 max-w-[52ch] leading-relaxed text-front-muted">
                Grupy startują, gdy zbierze się kilka osób na tym samym
                poziomie. Napisz — damy znać, gdy będzie się do czego zapisać.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/kontakt" className={btnSecondary}>
                  Napisz do nas
                </Link>
                <Link href="/terminy" className={btnSecondary}>
                  Zajęcia indywidualne
                  <ArrowRight />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
