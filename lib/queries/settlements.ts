/**
 * Rozliczenie lekcji indywidualnych — odpowiednik arkusza, który zastępujemy.
 *
 * Każdy wiersz to jedna lekcja: cena, część nauczyciela (`teacherPayout`),
 * marża jako różnica i znacznik wypłaty. Sumy liczymy w tym jednym miejscu,
 * bo z tych samych liczb korzysta strona panelu i eksport — rozjazd między
 * tabelą a plikiem byłby najgorszym możliwym błędem w rozliczeniu.
 *
 * Zajęcia grupowe tu nie wchodzą: rozliczają się miesięcznym abonamentem,
 * nie od lekcji, więc wrzucone do tej samej sumy zniekształciłyby wypłatę.
 */

import { endOfMonth, startOfMonth, subMonths } from "date-fns"

import { teacherScope, type DashboardContext } from "@/lib/auth"
import { monthKey } from "@/lib/dates"
import { studentLabel, teacherLabel } from "@/lib/format"
import type { BookingStatus, PaymentMethod } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/**
 * Rozliczamy to, co się odbyło albo jest umówione na pewno — tak samo jak
 * `lib/queries/statistics.ts`. Odwołana i odrzucona lekcja nie rodzi wypłaty.
 */
const COUNTED: BookingStatus[] = ["CONFIRMED", "COMPLETED"]

/** Ile miesięcy wstecz pokazujemy w przełączniku okresu. */
const PICKER_MONTHS = 12

export const ALL_PERIOD = "wszystko"

export type SettlementPeriod = {
  /** `"2026-11"` albo `"wszystko"`. */
  key: string
  label: string
  from: Date | null
  to: Date | null
}

export type SettlementRow = {
  id: string
  startsAt: Date
  status: BookingStatus
  student: string
  teacher: string
  teacherProfileId: string
  price: number | null
  payout: number | null
  /** Marża wychodzi tylko wtedy, gdy znamy obie kwoty. */
  margin: number | null
  paidOut: boolean
  paymentMethod: PaymentMethod | null
}

export type SettlementGroup = {
  key: string
  label: string
  lessons: number
  revenue: number
  payout: number
  margin: number
}

export type Settlement = Awaited<ReturnType<typeof getSettlement>>

const monthFormatter = new Intl.DateTimeFormat("pl-PL", {
  month: "long",
  year: "numeric",
})

/**
 * Granice okresu budujemy z lokalnych składowych daty. `new Date("2026-11")`
 * to północ UTC, czyli w naszej strefie ostatnie godziny października —
 * pierwszy dzień miesiąca wypadłby wtedy z zestawienia.
 */
export function resolvePeriod(key: string | undefined): SettlementPeriod {
  if (key === ALL_PERIOD) {
    return { key: ALL_PERIOD, label: "Cały okres", from: null, to: null }
  }

  const match = /^(\d{4})-(\d{2})$/.exec(key ?? "")
  const base = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, 1)
    : new Date()
  const from = startOfMonth(base)

  return {
    key: monthKey(from),
    label: monthFormatter.format(from),
    from,
    to: endOfMonth(base),
  }
}

/** Opcje przełącznika: ostatnie miesiące plus całość, bez zapytania do bazy. */
export function periodOptions(): { key: string; label: string }[] {
  const now = new Date()
  const months = Array.from({ length: PICKER_MONTHS }, (_, index) => {
    const date = startOfMonth(subMonths(now, index))
    return { key: monthKey(date), label: monthFormatter.format(date) }
  })
  return [...months, { key: ALL_PERIOD, label: "Cały okres" }]
}

export type SettlementFilters = {
  period: SettlementPeriod
  /** Zawężenie do jednego nauczyciela — działa tylko dla admina. */
  teacherProfileId?: string | null
}

function sum(rows: SettlementRow[], pick: (row: SettlementRow) => number) {
  return rows.reduce((total, row) => total + pick(row), 0)
}

function group(
  rows: SettlementRow[],
  keyOf: (row: SettlementRow) => { key: string; label: string }
): SettlementGroup[] {
  const buckets = new Map<string, SettlementGroup>()

  for (const row of rows) {
    const { key, label } = keyOf(row)
    const bucket = buckets.get(key) ?? {
      key,
      label,
      lessons: 0,
      revenue: 0,
      payout: 0,
      margin: 0,
    }
    bucket.lessons += 1
    bucket.revenue += row.price ?? 0
    bucket.payout += row.payout ?? 0
    bucket.margin += row.margin ?? 0
    buckets.set(key, bucket)
  }

  return [...buckets.values()].sort((a, b) => b.lessons - a.lessons)
}

export async function getSettlement(
  ctx: DashboardContext,
  filters: SettlementFilters
) {
  const scope = teacherScope(ctx)
  const { from, to } = filters.period

  const bookings = await prisma.booking.findMany({
    where: {
      // Filtr nauczyciela idzie **przed** zakresem uprawnień, żeby `scope`
      // mógł go nadpisać: admin ma tu `{}`, a nauczyciel własny profil.
      // Odwrotna kolejność pozwoliłaby nauczycielowi podmienić id w adresie
      // i obejrzeć cudze wypłaty.
      ...(filters.teacherProfileId
        ? { teacherProfileId: filters.teacherProfileId }
        : {}),
      ...scope,
      status: { in: COUNTED },
      ...(from && to ? { startsAt: { gte: from, lte: to } } : {}),
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      status: true,
      price: true,
      teacherPayout: true,
      paidOut: true,
      paymentMethod: true,
      teacherProfileId: true,
      guestName: true,
      studentId: true,
      student: { select: { firstName: true, lastName: true, email: true } },
      teacherProfile: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  const rows: SettlementRow[] = bookings.map((booking) => ({
    id: booking.id,
    startsAt: booking.startsAt,
    status: booking.status,
    student: studentLabel(booking),
    teacher: teacherLabel(booking.teacherProfile),
    teacherProfileId: booking.teacherProfileId,
    price: booking.price,
    payout: booking.teacherPayout,
    margin:
      booking.price === null || booking.teacherPayout === null
        ? null
        : booking.price - booking.teacherPayout,
    paidOut: booking.paidOut,
    paymentMethod: booking.paymentMethod,
  }))

  const paid = rows.filter((row) => row.paidOut)
  const unpaid = rows.filter((row) => !row.paidOut)

  // Uczeń bez konta nie ma id, więc kluczem zostaje jego nazwa — tak samo
  // jak w arkuszu, gdzie uczniów też rozróżniało się po wpisie na liście.
  const byStudent = group(rows, (row) => ({
    key: row.student,
    label: row.student,
  }))
  const byTeacher = group(rows, (row) => ({
    key: row.teacherProfileId,
    label: row.teacher,
  }))

  return {
    rows,
    byStudent,
    byTeacher: ctx.isAdmin ? byTeacher : [],
    totals: {
      lessons: rows.length,
      /** Suma cen — „TOTAL PROFIT" z arkusza. */
      revenue: sum(rows, (row) => row.price ?? 0),
      /** Suma części nauczycieli — „MOJE". */
      payout: sum(rows, (row) => row.payout ?? 0),
      /** Suma marży — liczona tylko z lekcji, które mają obie kwoty. */
      margin: sum(rows, (row) => row.margin ?? 0),
      /** „WYPŁACONE" i „DO WYPŁATY" sumują część nauczyciela, nie cenę. */
      paidOut: sum(paid, (row) => row.payout ?? 0),
      toPay: sum(unpaid, (row) => row.payout ?? 0),
      paidLessons: paid.length,
      /** Lekcje bez stawki nauczyciela — bez nich suma „MOJE" kłamie. */
      withoutPayout: rows.filter((row) => row.payout === null).length,
      /** Lekcje bez wpisanego sposobu płatności. */
      withoutPaymentMethod: rows.filter((row) => row.paymentMethod === null)
        .length,
      online: rows.filter((row) => row.paymentMethod === "ONLINE").length,
      cash: rows.filter((row) => row.paymentMethod === "CASH").length,
    },
  }
}

/**
 * Stawki godzinowe: admin dostaje wszystkich (to on je ustawia i wybiera
 * nauczyciela w przełączniku), nauczyciel wyłącznie własną — potrzebuje jej
 * do podpowiedzi „Moje" w formularzu lekcji odbytej. Nie jest to dla niego
 * nowa informacja, bo swoje wypłaty widzi na tej samej stronie, a zapis i tak
 * zatrzymuje `requireAdmin()` w `setTeacherPayoutRate()`.
 */
export async function getPayoutRates(ctx: DashboardContext) {
  const teachers = await prisma.teacherProfile.findMany({
    where: ctx.isAdmin ? {} : { id: ctx.teacherProfileId ?? "__brak__" },
    select: {
      id: true,
      payoutPerHour: true,
      user: { select: { firstName: true, lastName: true } },
    },
  })

  return teachers
    .map((teacher) => ({
      id: teacher.id,
      name: teacherLabel(teacher),
      payoutPerHour: teacher.payoutPerHour,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
}
