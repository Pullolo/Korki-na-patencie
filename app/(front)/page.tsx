import { ArrowRight, Clock3, Video, Wallet } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { SlotPicker } from "@/components/front/booking/slot-picker"
import { ArrowDoodle, Squiggle } from "@/components/front/doodles"
import { CtaSection } from "@/components/front/sections/cta"
import { FaqSection } from "@/components/front/sections/faq"
import { PricingSection } from "@/components/front/sections/pricing"
import { ReviewsSection } from "@/components/front/sections/reviews"
import { StepsSection } from "@/components/front/sections/steps"
import type { SubjectCardData } from "@/components/front/sections/subjects"
import { SubjectsSection } from "@/components/front/sections/subjects"
import { TeachersSection } from "@/components/front/sections/teachers"
import { btnPrimary, btnSecondary } from "@/components/front/styles"
import { plural } from "@/lib/format"
import { resolveHourlyPrice } from "@/lib/pricing"
import { getSlotBoard } from "@/lib/public/availability"
import { listFaq } from "@/lib/public/faq"
import { listGroups } from "@/lib/public/groups"
import { listLevels } from "@/lib/public/levels"
import { getPriceRules, getPriceTable } from "@/lib/public/pricing"
import { listReviews } from "@/lib/public/reviews"
import { getSiteSettings } from "@/lib/public/settings"
import { listSubjects } from "@/lib/public/subjects"
import { listTeachers } from "@/lib/public/teachers"
import { pageMetadata, seoDescription } from "@/lib/seo"

/**
 * Landing. Nagłówek, stopka i fonty mieszkają w `app/(front)/layout.tsx`,
 * a każda sekcja jest komponentem przyjmującym dane w propsach
 * (`components/front/sections/*`).
 *
 * Cała treść pochodzi z bazy: przedmioty, poziomy, cennik, nauczyciele,
 * opinie i pytania. Grafik w pierwszym widoku liczymy przy tym żądaniu —
 * to jedyna obietnica, której nie wolno oprzeć na cache'u.
 */

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return pageMetadata({
    title: settings.seoTitle || `${settings.siteName} — korepetycje z wolnym terminem`,
    description: seoDescription(
      settings.seoDescription || settings.tagline,
      "Zobacz wolne godziny korepetycji i zapisz się online — bez zakładania konta."
    ),
    path: "/",
    image: settings.seoOgImage,
    absoluteTitle: true,
  })
}

export default async function HomePage() {
  const [settings, subjects, levels, teachers, groups, reviews, faq, priceRules] =
    await Promise.all([
      getSiteSettings(),
      listSubjects(),
      listLevels(),
      listTeachers(),
      listGroups(),
      listReviews({ limit: 3 }),
      listFaq(),
      getPriceRules(),
    ])

  const [board, priceTable] = await Promise.all([
    getSlotBoard({ days: 5 }),
    getPriceTable(levels),
  ])

  // Landing pokazuje wyłącznie przedmioty, których ktoś naprawdę uczy —
  // przedmiot bez nauczyciela to obietnica bez pokrycia. Stawka „od" liczy się
  // z reguł cenowych i tylko dla poziomów, które ci nauczyciele prowadzą.
  const subjectCards: SubjectCardData[] = subjects
    .map((subject) => {
      const taught = teachers.filter((teacher) =>
        teacher.subjects.some((item) => item.id === subject.id)
      )
      const levelIds = new Set(
        taught.flatMap(
          (teacher) =>
            teacher.subjects
              .find((item) => item.id === subject.id)
              ?.levels.map((level) => level.id) ?? []
        )
      )

      const prices = levels
        .filter((level) => levelIds.has(level.id))
        .map((level) =>
          resolveHourlyPrice(priceRules, {
            subjectId: subject.id,
            levelId: level.id,
          })
        )
        .filter((price): price is number => price !== null)

      return {
        id: subject.id,
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        icon: subject.icon,
        levels: levels.filter((level) => levelIds.has(level.id)),
        fromPrice: prices.length > 0 ? Math.min(...prices) : null,
        teacherCount: taught.length,
      }
    })
    .filter((subject) => subject.teacherCount > 0)

  // W karcie wyboru terminu zostają te same przedmioty co w sekcji niżej.
  const pickerSubjects = subjectCards.map((subject) => ({
    id: subject.id,
    name: subject.name,
    slug: subject.slug,
  }))

  const freeSlots: Record<string, number> = {}
  for (const slot of board.slots) {
    freeSlots[slot.teacherId] = (freeSlots[slot.teacherId] ?? 0) + 1
  }

  const modes = new Set(
    teachers.flatMap((teacher) =>
      teacher.locations.map((location) => location.type)
    )
  )

  const facts = [
    { icon: Wallet, label: "Płacisz po lekcji" },
    {
      icon: Clock3,
      label: `Odwołanie do ${settings.bookingMinLeadHours} h przed`,
    },
    {
      icon: Video,
      label:
        modes.has("ONLINE") && modes.size > 1
          ? "Online albo na miejscu"
          : modes.has("ONLINE")
            ? "Zajęcia online"
            : "Zajęcia stacjonarne",
    },
  ]

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-front-ground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--front-dots)_1.1px,transparent_1.1px)] [background-size:22px_22px] opacity-60"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <h1 className="font-display text-[2.6rem] leading-[1.18] font-semibold tracking-[-0.02em] text-balance sm:text-6xl">
              Zobacz{" "}
              <span className="relative inline-block whitespace-nowrap">
                wolną godzinę
                <Squiggle className="absolute -bottom-1 left-0 h-[0.3em] w-full text-front-brand" />
              </span>{" "}
              <span className="whitespace-nowrap">i zapisz się</span> w minutę
            </h1>

            <p className="mt-7 max-w-[46ch] text-lg leading-relaxed text-front-muted">
              {subjectCards
                .slice(0, 3)
                .map((subject) => subject.name)
                .join(", ")}{" "}
              — z nauczycielem, który tłumaczy do skutku. Grafik na stronie jest
              prawdziwy: godzina, którą widzisz, jest naprawdę wolna, a cenę
              znasz, zanim napiszesz pierwszą wiadomość.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/terminy" className={btnPrimary}>
                Zobacz wszystkie terminy
                <ArrowRight />
              </Link>
              <Link href="#jak-to-dziala" className={btnSecondary}>
                Jak to działa
              </Link>
            </div>

            <ul className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {facts.map((fact) => (
                <li
                  key={fact.label}
                  className="flex items-center gap-2 font-semibold text-front-ink"
                >
                  <fact.icon className="size-5 text-front-brand" />
                  {fact.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-2 hidden items-end gap-2 pl-6 lg:flex">
              <ArrowDoodle className="h-12 w-14 shrink-0 text-front-brand" />
              <p className="max-w-[24ch] pb-3 font-display text-base leading-snug font-semibold text-front-muted">
                tu wybierasz godzinę, a nie wypełniasz formularz
              </p>
            </div>

            <div className="relative">
              {/* Naklejka. Obrót jest tu językiem, nie przypadkiem — dzielą go
                  zakreślacz w nagłówkach i karteczki z opiniami. */}
              <span className="absolute -top-4 -right-1 z-10 rotate-[7deg] rounded-2xl bg-front-sun-soft px-3.5 py-2 font-display text-sm leading-tight font-semibold text-front-sun shadow-[0_10px_20px_-14px_color-mix(in_oklch,var(--front-ink),transparent_40%)] ring-1 ring-front-sun/40 sm:text-base">
                pierwsza lekcja
                <br className="sm:hidden" /> bez zobowiązań
              </span>

              <SlotPicker
                board={board}
                subjects={pickerSubjects}
                levels={levels}
                currency={settings.currency}
                note={
                  board.slots.length > 0
                    ? `${board.slots.length} ${plural(board.slots.length, "wolna godzina", "wolne godziny", "wolnych godzin")} w najbliższych ${board.days.length} dniach · liczone przy każdym wejściu`
                    : "Wolne godziny wchodzą z grafiku nauczycieli w panelu."
                }
              />
            </div>
          </div>
        </div>
      </section>

      <SubjectsSection subjects={subjectCards} currency={settings.currency} />

      <StepsSection />

      <TeachersSection teachers={teachers.slice(0, 3)} freeSlots={freeSlots} />

      <PricingSection
        rows={priceTable}
        groups={groups}
        discountPercent={settings.groupDiscountPercent}
        currency={settings.currency}
      />

      <ReviewsSection reviews={reviews} />

      <FaqSection items={faq} />

      <CtaSection settings={settings} />
    </>
  )
}
