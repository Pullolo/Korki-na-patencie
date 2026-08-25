"use server"

import { revalidatePath } from "next/cache"

import { requireTeacherAccess } from "@/lib/auth"
import { conflictMessage, findScheduleConflicts } from "@/lib/conflicts"
import type { LocationType } from "@/lib/generated/prisma/enums"
import { notify } from "@/lib/notifications"
import { resolveHourlyPrice } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"

/**
 * Ręczny zapis lekcji z panelu — ustalonej przez telefon, nie przez formularz
 * na stronie. Dlatego domyślnie jest od razu potwierdzona i nie obowiązują jej
 * `minLeadHours` ani `maxAdvanceDays`: to reguły dla ucznia rezerwującego sam,
 * a nie dla nauczyciela wpisującego własną umowę. Kolizja terminu obowiązuje
 * dalej, ale da się ją świadomie pominąć (`allowOverlap`).
 */

export type CreateBookingInput = {
  teacherProfileId: string
  /** Uczeń z listy… */
  studentId: string | null
  /** …albo nowa osoba, którą zakładamy bez konta w Clerku. */
  studentName: string
  studentPhone: string | null
  studentEmail: string | null
  subjectId: string | null
  levelId: string | null
  locationId: string | null
  mode: LocationType
  /** Data i godzina jako ściana zegara („2026-08-26", „17:00") — bez stref. */
  date: string
  time: string
  durationMin: number
  /** Puste = policz z cennika. */
  price: number | null
  confirmed: boolean
  note: string | null
  allowOverlap: boolean
}

/** Kod dyktowany przez telefon — bez znaków, które łatwo pomylić (0/O, 1/I). */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

async function uniqueReference() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Array.from(
      { length: 4 },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join("")
    const reference = `KOR-${code}`
    const taken = await prisma.booking.findUnique({
      where: { reference },
      select: { id: true },
    })
    if (!taken) return reference
  }
  throw new Error("Nie udało się wygenerować numeru rezerwacji.")
}

/** „Jan Kowalski" → imię + reszta jako nazwisko; jedno słowo zostaje imieniem. */
function splitName(full: string) {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: null }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

function clean(value: string | null | undefined) {
  return value?.trim() || null
}

/**
 * Uczeń bez konta to zwykły wiersz `users` bez `clerkId` — dzięki temu ma kartę,
 * historię lekcji i notatki jak każdy inny. Zanim założymy nowego, szukamy po
 * mailu i telefonie, żeby druga rozmowa telefoniczna nie zrobiła duplikatu.
 */
async function resolveStudentId(input: CreateBookingInput) {
  if (input.studentId) {
    const student = await prisma.user.findUnique({
      where: { id: input.studentId },
      select: { id: true },
    })
    if (!student) throw new Error("Nie znaleziono wskazanego ucznia.")
    return { studentId: student.id, created: false }
  }

  const name = input.studentName.trim()
  if (name.length < 3) {
    throw new Error("Wybierz ucznia z listy albo podaj imię i nazwisko.")
  }

  const email = clean(input.studentEmail)?.toLowerCase() ?? null
  const phone = clean(input.studentPhone)
  const duplicateOf = [
    ...(email ? [{ email }] : []),
    ...(phone ? [{ phone, role: "STUDENT" as const }] : []),
  ]

  if (duplicateOf.length > 0) {
    const match = await prisma.user.findFirst({
      where: { OR: duplicateOf },
      select: { id: true },
    })
    if (match) return { studentId: match.id, created: false }
  }

  const created = await prisma.user.create({
    data: { ...splitName(name), email, phone, role: "STUDENT" },
    select: { id: true },
  })
  return { studentId: created.id, created: true }
}

function parseStart(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error("Nieprawidłowa data albo godzina.")
  }
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

async function resolvePrice(input: CreateBookingInput, durationMin: number) {
  if (input.price !== null) return input.price

  const rules = await prisma.priceRule.findMany({
    where: { isActive: true },
    select: {
      levelId: true,
      subjectId: true,
      teacherProfileId: true,
      pricePerHour: true,
      isActive: true,
    },
  })
  const hourly = resolveHourlyPrice(rules, {
    levelId: input.levelId,
    subjectId: input.subjectId,
    teacherProfileId: input.teacherProfileId,
  })
  if (hourly === null) return null
  // `Booking.price` to kwota za całą lekcję — statystyki sumują ją jako przychód.
  return Math.round((hourly * durationMin) / 60)
}

export async function createBooking(input: CreateBookingInput) {
  const ctx = await requireTeacherAccess(input.teacherProfileId)

  const durationMin = Math.round(input.durationMin)
  if (durationMin < 15 || durationMin > 480) {
    throw new Error("Lekcja musi trwać od 15 do 480 minut.")
  }
  if (input.price !== null && (input.price < 0 || input.price > 100_000)) {
    throw new Error("Cena musi mieścić się między 0 a 100 000.")
  }

  const startsAt = parseStart(input.date, input.time)
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000)

  if (input.locationId) {
    const location = await prisma.location.findFirst({
      where: { id: input.locationId, teacherProfileId: input.teacherProfileId },
      select: { id: true },
    })
    if (!location) {
      throw new Error("Wybrana lokalizacja nie należy do tego nauczyciela.")
    }
  }

  if (!input.allowOverlap) {
    const conflicts = await findScheduleConflicts({
      teacherProfileId: input.teacherProfileId,
      startsAt,
      endsAt,
    })
    if (conflicts.length > 0) throw new Error(conflictMessage(conflicts))
  }

  const { studentId, created } = await resolveStudentId(input)
  const price = await resolvePrice(input, durationMin)

  const booking = await prisma.booking.create({
    data: {
      reference: await uniqueReference(),
      teacherProfileId: input.teacherProfileId,
      studentId,
      subjectId: input.subjectId,
      levelId: input.levelId,
      locationId: input.locationId,
      mode: input.mode,
      startsAt,
      endsAt,
      price,
      status: input.confirmed ? "CONFIRMED" : "PENDING",
      confirmedAt: input.confirmed ? new Date() : null,
      internalNote: clean(input.note),
    },
    select: { id: true, reference: true },
  })

  // Nauczyciel nie potrzebuje powiadomienia o lekcji, którą sam wpisał —
  // ale gdy zrobił to za niego admin, musi się o niej dowiedzieć.
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: input.teacherProfileId },
    select: { userId: true },
  })
  if (teacher && teacher.userId !== ctx.userId) {
    await notify({
      type: "BOOKING_CREATED",
      title: "Nowa lekcja w Twoim grafiku",
      message: `${input.studentName.trim()} · ${input.date}, ${input.time}`,
      link: `/dashboard/rezerwacje/${booking.id}`,
      userId: teacher.userId,
    })
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/rezerwacje")
  revalidatePath("/dashboard/kalendarz")
  revalidatePath("/dashboard/uczniowie")
  revalidatePath("/dashboard/dostepnosc")

  return {
    id: booking.id,
    reference: booking.reference,
    createdStudent: created,
  }
}
