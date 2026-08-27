import { ArrowRight, MessageCircle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import {
  SlotResults,
  SlotResultsEmpty,
} from "@/components/front/booking/slot-results"
import type { FilterGroup } from "@/components/front/catalog/filter-bar"
import { FilterBar } from "@/components/front/catalog/filter-bar"
import { PageHero } from "@/components/front/layout/page-hero"
import { btnPrimary, btnSecondary } from "@/components/front/styles"
import { formatLongDate, formatTime, plural } from "@/lib/format"
import { getSlotBoard } from "@/lib/public/availability"
import { listLevels } from "@/lib/public/levels"
import { firstParam, MODE_OPTIONS, modeFromSlug } from "@/lib/public/modes"
import { getSiteSettings } from "@/lib/public/settings"
import { listSubjectCards } from "@/lib/public/subjects"
import { teacherTeaches } from "@/lib/public/slot-board"
import { pageMetadata } from "@/lib/seo"

/** Horyzont wyszukiwarki: dwa tygodnie do przodu. */
const HORIZON_DAYS = 14

type SearchParams = {
  przedmiot?: string | string[]
  poziom?: string | string[]
  tryb?: string | string[]
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Wolne terminy",
    description:
      "Wszystkie wolne godziny korepetycji na dwa tygodnie do przodu. Wybierz przedmiot, poziom i formę zajęć — potem jedno kliknięcie do rezerwacji.",
    path: "/terminy",
  })
}

export default async function SlotSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const subjectSlug = firstParam(params.przedmiot)
  const levelSlug = firstParam(params.poziom)
  const modeSlug = firstParam(params.tryb)

  const [settings, subjects, levels] = await Promise.all([
    getSiteSettings(),
    listSubjectCards({ onlyTaught: true }),
    listLevels(),
  ])

  const subject = subjects.find((item) => item.slug === subjectSlug) ?? null
  const level = levels.find((item) => item.slug === levelSlug) ?? null
  const mode = modeFromSlug(modeSlug)

  // Filtr trybu zawęża zapytanie do bazy; przedmiot i poziom zostawiamy
  // otwarte, żeby przy pustym wyniku móc pokazać najbliższy termin u kogokolwiek.
  const board = await getSlotBoard({ mode, days: HORIZON_DAYS })

  const teachers = new Map(board.teachers.map((item) => [item.id, item]))
  const matching = board.slots.filter((slot) =>
    teacherTeaches(teachers.get(slot.teacherId), subject?.id ?? null, level?.id ?? null)
  )
  const fallback = board.slots[0] ?? null
  const fallbackTeacher = fallback ? teachers.get(fallback.teacherId) : null

  const groups: FilterGroup[] = [
    {
      key: "przedmiot",
      label: "Przedmiot",
      options: subjects.map((item) => ({ value: item.slug, label: item.name })),
    },
    {
      key: "poziom",
      label: "Poziom",
      options: levels.map((item) => ({ value: item.slug, label: item.name })),
    },
    { key: "tryb", label: "Tryb", options: MODE_OPTIONS },
  ]

  return (
    <>
      <PageHero
        crumbs={[{ label: "Wolne terminy" }]}
        title="Wszystkie wolne godziny"
        lead={`Grafik na ${HORIZON_DAYS} dni do przodu, liczony przy każdym wejściu. Kliknij godzinę, żeby przejść do rezerwacji — konto nie jest potrzebne.`}
      >
        <FilterBar
          basePath="/terminy"
          params={{
            przedmiot: subjectSlug,
            poziom: levelSlug,
            tryb: modeSlug,
          }}
          groups={groups}
          resultLabel={`${matching.length} ${plural(matching.length, "wolna godzina", "wolne godziny", "wolnych godzin")}`}
        />
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
          {matching.length > 0 ? (
            <SlotResults
              board={{ ...board, slots: matching }}
              subjectSlug={subject?.slug ?? null}
              subjectId={subject?.id ?? null}
              levelSlug={level?.slug ?? null}
              levelId={level?.id ?? null}
              currency={settings.currency}
            />
          ) : (
            <SlotResultsEmpty>
              <h2 className="mt-5 font-display text-2xl font-semibold">
                Nic wolnego przy tym wyborze
              </h2>
              {fallback && fallbackTeacher ? (
                <>
                  <p className="mx-auto mt-2 max-w-[52ch] leading-relaxed text-front-muted">
                    Najbliższa wolna godzina u kogokolwiek to{" "}
                    <span className="font-semibold text-front-ink">
                      {formatLongDate(new Date(fallback.startsAt))},{" "}
                      {formatTime(new Date(fallback.startsAt))}
                    </span>{" "}
                    u {fallbackTeacher.name}.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link
                      href={`/rezerwacja?termin=${encodeURIComponent(fallback.startsAt)}&nauczyciel=${fallbackTeacher.slug}`}
                      className={btnPrimary}
                    >
                      Zajmij ten termin
                      <ArrowRight />
                    </Link>
                    <Link href="/terminy" className={btnSecondary}>
                      Wyczyść filtry
                    </Link>
                  </div>
                </>
              ) : (
                <p className="mx-auto mt-2 max-w-[52ch] leading-relaxed text-front-muted">
                  W najbliższych {HORIZON_DAYS} dniach nie ma ani jednej wolnej
                  godziny. Napisz do nas — układamy grafik z wyprzedzeniem
                  i damy znać, gdy coś się zwolni.
                </p>
              )}
              <div className="mt-6">
                <Link
                  href={`/kontakt${subject ? `?przedmiot=${subject.slug}` : ""}`}
                  className={btnSecondary}
                >
                  <MessageCircle />
                  Napisz do nas
                </Link>
              </div>
            </SlotResultsEmpty>
          )}
        </div>
      </section>
    </>
  )
}
