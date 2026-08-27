import { CalendarX2 } from "lucide-react"
import type { Metadata } from "next"

import { BookingForm } from "@/components/front/booking/booking-form"
import { SlotPicker } from "@/components/front/booking/slot-picker"
import { PageHero } from "@/components/front/layout/page-hero"
import { cardBase } from "@/components/front/styles"
import { formStamp } from "@/lib/actions/public/guard"
import { currentUser } from "@clerk/nextjs/server"
import { formatLongDate, personName } from "@/lib/format"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import { lessonPrice, resolveHourlyPrice } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"
import { getSlotBoard } from "@/lib/public/availability"
import { listLevels } from "@/lib/public/levels"
import { firstParam } from "@/lib/public/modes"
import { getPriceRules } from "@/lib/public/pricing"
import { getSiteSettings } from "@/lib/public/settings"
import { listSubjectCards } from "@/lib/public/subjects"
import { getTeacher } from "@/lib/public/teachers"
import { pageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

/** Ile dni pokazujemy, gdy termin trzeba dopiero wybrać. */
const HORIZON_DAYS = 14

type SearchParams = {
  termin?: string | string[]
  nauczyciel?: string | string[]
  przedmiot?: string | string[]
  poziom?: string | string[]
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Rezerwacja lekcji",
    description:
      "Wybierz wolny termin, zostaw kontakt i gotowe. Bez zakładania konta i bez płatności z góry.",
    path: "/rezerwacja",
  })
}

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const termin = firstParam(params.termin)
  const teacherSlug = firstParam(params.nauczyciel)
  const subjectSlug = firstParam(params.przedmiot)
  const levelSlug = firstParam(params.poziom)

  const [settings, levels, subjectCards] = await Promise.all([
    getSiteSettings(),
    listLevels(),
    listSubjectCards({ onlyTaught: true }),
  ])

  const startsAt = termin ? new Date(termin) : null
  const validDate = startsAt && !Number.isNaN(startsAt.getTime())

  const teacher = teacherSlug ? await getTeacher(teacherSlug) : null

  // Termin sprawdzamy tym samym kodem, który liczy grafik na stronie —
  // link sprzed godziny mógł już przestać być aktualny.
  const dayBoard =
    teacher && validDate
      ? await getSlotBoard({
          teacherProfileId: teacher.id,
          from: startOfDay(startsAt),
          days: 1,
        })
      : null

  const slot =
    dayBoard?.slots.find(
      (item) => item.startsAt === startsAt?.toISOString()
    ) ?? null

  if (teacher && slot) {
    const [priceRules, clerkUser] = await Promise.all([
      getPriceRules(),
      currentUser(),
    ])

    const subject =
      teacher.subjects.find((item) => item.slug === subjectSlug) ??
      teacher.subjects[0] ??
      null

    const account = clerkUser
      ? await prisma.user.findUnique({
          where: { clerkId: clerkUser.id },
          select: { firstName: true, lastName: true, email: true, phone: true },
        })
      : null

    const usableLevels = (subject?.levels ?? levels).map((level) => {
      const hourly = resolveHourlyPrice(priceRules, {
        levelId: level.id,
        subjectId: subject?.id ?? null,
        teacherProfileId: teacher.id,
      })
      return {
        id: level.id,
        slug: level.slug,
        name: level.name,
        pricePerHour: hourly,
        total: hourly === null ? null : lessonPrice(hourly, slot.minutes),
      }
    })

    return (
      <>
        <PageHero
          crumbs={[{ label: "Rezerwacja" }]}
          title="Zostaw kontakt, resztę załatwimy"
          lead={
            settings.bookingAutoConfirm
              ? "Termin blokuje się od razu po wysłaniu zgłoszenia."
              : "Zgłoszenie trafia do nauczyciela. Potwierdzenie wraca tego samego dnia, a płacisz dopiero po lekcji."
          }
        />

        <section className="bg-front-surface">
          <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
            <BookingForm
              slot={{
                startsAt: slot.startsAt,
                time: slot.time,
                dayLabel: formatLongDate(new Date(slot.startsAt)),
                minutes: slot.minutes,
                teacherName: teacher.name,
                teacherSlug: teacher.slug,
                locationName: slot.locationName,
                modeLabel: slot.mode
                  ? LOCATION_TYPE_LABELS[slot.mode]
                  : null,
              }}
              subjectSlug={subject?.slug ?? null}
              subjectName={subject?.name ?? null}
              levels={usableLevels}
              initialLevelSlug={
                usableLevels.find((item) => item.slug === levelSlug)?.slug ??
                null
              }
              currency={settings.currency}
              stamp={formStamp()}
              defaults={{
                name: account ? personName(account) : "",
                email: account?.email ?? "",
                phone: account?.phone ?? "",
              }}
            />
          </div>
        </section>
      </>
    )
  }

  // Bez terminu w adresie (albo gdy przepadł) zaczynamy od wyboru godziny.
  const subject = subjectCards.find((item) => item.slug === subjectSlug) ?? null
  const board = await getSlotBoard({
    subjectId: subject?.id ?? null,
    days: HORIZON_DAYS,
  })

  return (
    <>
      <PageHero
        crumbs={[{ label: "Rezerwacja" }]}
        title="Najpierw godzina, potem dane"
        lead="Wybierz termin, który Ci pasuje. Dane zostawisz w następnym kroku — konto nie jest do niczego potrzebne."
      />

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
          {termin && (
            <div
              className={cn(
                cardBase,
                "mb-6 flex items-start gap-3 bg-front-coral-soft p-5"
              )}
            >
              <CalendarX2 className="mt-0.5 size-5 shrink-0 text-front-coral" />
              <div>
                <p className="font-semibold text-front-ink">
                  Ten termin nie jest już wolny
                </p>
                <p className="mt-1 leading-relaxed text-front-muted">
                  Ktoś zdążył go zająć albo minęło wyprzedzenie wymagane do
                  rezerwacji. Poniżej są godziny, które są wolne teraz.
                </p>
              </div>
            </div>
          )}

          <SlotPicker
            board={board}
            subjects={subjectCards.map((item) => ({
              id: item.id,
              name: item.name,
              slug: item.slug,
            }))}
            levels={levels}
            initialSubjectId={subject?.id ?? null}
            initialLevelId={
              levels.find((item) => item.slug === levelSlug)?.id ?? null
            }
            currency={settings.currency}
          />
        </div>
      </section>
    </>
  )
}
