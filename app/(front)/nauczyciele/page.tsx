import { MessageCircle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { TeacherCard } from "@/components/front/catalog/teacher-card"
import type { FilterGroup } from "@/components/front/catalog/filter-bar"
import { FilterBar } from "@/components/front/catalog/filter-bar"
import { PageHero } from "@/components/front/layout/page-hero"
import { btnSecondary, cardBase } from "@/components/front/styles"
import { plural } from "@/lib/format"
import { getSlotBoard } from "@/lib/public/availability"
import { listLevels } from "@/lib/public/levels"
import { firstParam, MODE_OPTIONS, modeFromSlug } from "@/lib/public/modes"
import { getSiteSettings } from "@/lib/public/settings"
import { listSubjects } from "@/lib/public/subjects"
import { listTeachers } from "@/lib/public/teachers"
import { pageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

/** Ile dni grafiku liczymy do liczby wolnych godzin przy nazwisku. */
const HORIZON_DAYS = 7

type SearchParams = {
  przedmiot?: string | string[]
  poziom?: string | string[]
  tryb?: string | string[]
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return pageMetadata({
    title: "Nauczyciele",
    description: `Kto uczy w ${settings.siteName}: przedmioty, poziomy, miejsca zajęć i wolne godziny w najbliższym tygodniu.`,
    path: "/nauczyciele",
  })
}

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const subjectSlug = firstParam(params.przedmiot)
  const levelSlug = firstParam(params.poziom)
  const modeSlug = firstParam(params.tryb)

  const [subjects, levels] = await Promise.all([listSubjects(), listLevels()])

  const subject = subjects.find((item) => item.slug === subjectSlug) ?? null
  const level = levels.find((item) => item.slug === levelSlug) ?? null
  const mode = modeFromSlug(modeSlug)

  const filter = {
    subjectId: subject?.id ?? null,
    levelId: level?.id ?? null,
    mode,
  }

  const [teachers, board] = await Promise.all([
    listTeachers(filter),
    getSlotBoard({ ...filter, days: HORIZON_DAYS }),
  ])

  const freeSlots: Record<string, number> = {}
  for (const slot of board.slots) {
    freeSlots[slot.teacherId] = (freeSlots[slot.teacherId] ?? 0) + 1
  }

  const groups: FilterGroup[] = [
    {
      key: "przedmiot",
      label: "Przedmiot",
      options: subjects.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
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
        crumbs={[{ label: "Nauczyciele" }]}
        title="Ludzie, którzy będą uczyć"
        lead="Każdy prowadzi własny grafik i własne miejsca zajęć. Liczba wolnych godzin dotyczy najbliższego tygodnia i jest liczona na bieżąco."
      >
        <FilterBar
          basePath="/nauczyciele"
          params={{
            przedmiot: subjectSlug,
            poziom: levelSlug,
            tryb: modeSlug,
          }}
          groups={groups}
          resultLabel={`${teachers.length} ${plural(teachers.length, "nauczyciel", "nauczycieli", "nauczycieli")} pasuje do wyboru`}
        />
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          {teachers.length > 0 ? (
            <div
              className={cn(
                cardBase,
                "divide-y divide-front-line overflow-hidden"
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
          ) : (
            <div className={cn(cardBase, "p-8 text-center sm:p-12")}>
              <h2 className="font-display text-2xl font-semibold">
                Nikt taki u nas nie uczy
              </h2>
              <p className="mx-auto mt-2 max-w-[52ch] leading-relaxed text-front-muted">
                Przy tym zestawie filtrów nie mamy nikogo. Zdejmij jeden
                z nich albo napisz do nas — jeśli szukamy nauczyciela do tego
                przedmiotu, powiemy wprost.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/nauczyciele" className={btnSecondary}>
                  Pokaż wszystkich
                </Link>
                <Link
                  href={`/kontakt${subject ? `?przedmiot=${subject.slug}` : ""}`}
                  className={btnSecondary}
                >
                  <MessageCircle />
                  Napisz do nas
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
