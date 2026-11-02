"use server"

import { revalidatePath } from "next/cache"

import {
  requireAdmin,
  requireDashboardUser,
  requireTeacherAccess,
} from "@/lib/auth"
import { formatDate } from "@/lib/format"
import type { PaymentMethod } from "@/lib/generated/prisma/enums"
import { PAYMENT_METHOD_LABELS } from "@/lib/labels"
import { prisma } from "@/lib/prisma"
import {
  getSettlement,
  resolvePeriod,
  type SettlementRow,
} from "@/lib/queries/settlements"

/** Górna granica kwot — ta sama co dla ceny lekcji w `booking-create.ts`. */
const MAX_AMOUNT = 100_000

function refresh() {
  revalidatePath("/dashboard/rozliczenia")
}

/**
 * Nauczyciel rozlicza wyłącznie swoje lekcje, admin wszystkie. Bramka pyta
 * o profil z samej rezerwacji, więc nie da się jej obejść id z formularza.
 */
async function loadForSettlement(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, teacherProfileId: true },
  })
  if (!booking) throw new Error("Nie znaleziono lekcji.")
  await requireTeacherAccess(booking.teacherProfileId)
  return booking
}

/** „Wypłacone?" z arkusza — jedyne pole, które nauczyciel odhacza ręcznie. */
export async function setLessonPaidOut(bookingId: string, paidOut: boolean) {
  const booking = await loadForSettlement(bookingId)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { paidOut },
  })
  refresh()
}

export async function setLessonPaymentMethod(
  bookingId: string,
  method: PaymentMethod | null
) {
  const booking = await loadForSettlement(bookingId)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { paymentMethod: method },
  })
  refresh()
}

/**
 * Ręczna korekta części nauczyciela. Stawka z profilu daje tylko wartość
 * początkową — w arkuszu kwoty też dawało się poprawić per uczeń, a raz
 * zapisana lekcja nie ma się zmieniać po podniesieniu stawki.
 */
export async function setLessonPayout(
  bookingId: string,
  payout: number | null
) {
  const booking = await loadForSettlement(bookingId)
  if (payout !== null && (payout < 0 || payout > MAX_AMOUNT)) {
    throw new Error(`Kwota musi mieścić się między 0 a ${MAX_AMOUNT}.`)
  }
  await prisma.booking.update({
    where: { id: booking.id },
    data: { teacherPayout: payout },
  })
  refresh()
}

/**
 * Stawka nauczyciela decyduje o podziale pieniędzy między niego i serwis,
 * więc ustawia ją wyłącznie admin — nauczyciel nie podnosi sobie wypłaty.
 * Zmiana działa od następnej zapisanej lekcji: starych migawek nie rusza.
 */
export async function setTeacherPayoutRate(
  teacherProfileId: string,
  payoutPerHour: number | null
) {
  await requireAdmin()
  if (
    payoutPerHour !== null &&
    (payoutPerHour < 0 || payoutPerHour > MAX_AMOUNT)
  ) {
    throw new Error(`Stawka musi mieścić się między 0 a ${MAX_AMOUNT}.`)
  }
  await prisma.teacherProfile.update({
    where: { id: teacherProfileId },
    data: { payoutPerHour },
  })
  refresh()
  revalidatePath("/dashboard/nauczyciele")
}

// ─── Eksport ──────────────────────────────────────────────────────────────────

/**
 * Excel w polskiej lokalizacji dzieli kolumny średnikiem, a nie przecinkiem,
 * i bez znacznika BOM czyta UTF-8 jako stronę kodową Windows — „ś" robi się
 * wtedy krzaczkiem. Dlatego separator to `;`, liczby mają przecinek
 * dziesiętny, a plik zaczyna się od BOM.
 */
const SEPARATOR = ";"

function cell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ""
  const text =
    typeof value === "number" ? String(value).replace(".", ",") : value
  // Średnik, cudzysłów i złamanie wiersza muszą wejść w cudzysłowy, inaczej
  // nazwisko z przecinkiem rozsypuje kolumny.
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function line(cells: (string | number | null | undefined)[]) {
  return cells.map(cell).join(SEPARATOR)
}

function lessonLines(rows: SettlementRow[], withTeacher: boolean) {
  const header = [
    "Data",
    "Uczeń",
    ...(withTeacher ? ["Nauczyciel"] : []),
    "Cena (zł)",
    "Moje (zł)",
    "Marża (zł)",
    "Płatność",
    "Wypłacone?",
  ]

  return [
    line(header),
    ...rows.map((row) =>
      line([
        formatDate(row.startsAt),
        row.student,
        ...(withTeacher ? [row.teacher] : []),
        row.price,
        row.payout,
        row.margin,
        row.paymentMethod ? PAYMENT_METHOD_LABELS[row.paymentMethod] : "",
        row.paidOut ? "TAK" : "NIE",
      ])
    ),
  ]
}

export type ExportInput = {
  period?: string
  teacherProfileId?: string | null
}

/**
 * Zwraca gotowy plik jako tekst — pobranie składa przeglądarka. Dzięki temu
 * eksport przechodzi tą samą bramką co strona i nie potrzebuje publicznego
 * adresu, który trzeba by chronić osobno. Liczby pochodzą z tego samego
 * `getSettlement()`, więc plik nie może się rozjechać z tabelą.
 */
export async function exportSettlement(input: ExportInput) {
  const ctx = await requireDashboardUser()
  const period = resolvePeriod(input.period)
  const data = await getSettlement(ctx, {
    period,
    teacherProfileId: input.teacherProfileId ?? null,
  })

  const { totals } = data
  const rows = [
    line([`Rozliczenie lekcji — ${period.label}`]),
    "",
    ...lessonLines(data.rows, ctx.isAdmin),
    "",
    line(["PODSUMOWANIE"]),
    line(["Liczba lekcji", totals.lessons]),
    line(["TOTAL PROFIT", totals.revenue]),
    line(["MOJE", totals.payout]),
    line(["WYPŁACONE", totals.paidOut]),
    line(["DO WYPŁATY", totals.toPay]),
    line(["Marża łącznie", totals.margin]),
    line(["Płatności online", totals.online]),
    line(["Płatności gotówką", totals.cash]),
    "",
    line(["PER UCZEŃ"]),
    line(["Uczeń", "Lekcje", "Total (zł)", "Moje razem (zł)", "Marża (zł)"]),
    ...data.byStudent.map((item) =>
      line([item.label, item.lessons, item.revenue, item.payout, item.margin])
    ),
  ]

  if (ctx.isAdmin && data.byTeacher.length > 0) {
    rows.push(
      "",
      line(["PER NAUCZYCIEL"]),
      line([
        "Nauczyciel",
        "Lekcje",
        "Total (zł)",
        "Do wypłaty razem (zł)",
        "Marża (zł)",
      ]),
      ...data.byTeacher.map((item) =>
        line([item.label, item.lessons, item.revenue, item.payout, item.margin])
      )
    )
  }

  return {
    filename: `rozliczenie-${period.key}.csv`,
    content: `﻿${rows.join("\r\n")}`,
  }
}
