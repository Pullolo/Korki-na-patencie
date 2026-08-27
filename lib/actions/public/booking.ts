"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { conflictMessage, findScheduleConflicts } from "@/lib/conflicts"
import { formatLongDate, formatTime } from "@/lib/format"
import { notify } from "@/lib/notifications"
import { lessonPrice, resolveHourlyPrice } from "@/lib/pricing"
import { prisma } from "@/lib/prisma"
import {
  clientIp,
  honeypotFilled,
  recentBookingCount,
  stampLooksHuman,
  tooManyFromAddress,
} from "@/lib/actions/public/guard"
import { splitName, uniqueBookingReference } from "@/lib/reference"
import { getSlotBoard } from "@/lib/public/availability"
import { getPriceRules } from "@/lib/public/pricing"
import { getSiteSettings } from "@/lib/public/settings"
import * as v from "@/lib/validation"

/**
 * Rezerwacja z formularza na stronie.
 *
 * Różni się od panelowej `createBooking()` wszystkim, co dotyczy zaufania:
 * nie ma zalogowanego nauczyciela, wejście jest od nieznajomego, a reguły
 * (wyprzedzenie, horyzont, kolizja) sprawdzamy **ponownie** po stronie serwera,
 * nawet jeśli przeglądarka pokazała tylko wolne godziny. Między wyborem
 * a wysłaniem ktoś mógł zająć ten termin.
 *
 * Nie rzucamy wyjątkiem: formularz publiczny musi umieć podświetlić konkretne
 * pole, a nie pokazać jeden komunikat na całość.
 */

const schema = z.object({
  teacherSlug: v.slug,
  subjectSlug: v.optionalSlug,
  levelSlug: v.optionalSlug,
  startsAt: z.string().trim().min(1, "Wybierz termin."),
  name: v.personName,
  phone: v.phone,
  email: v.optionalEmail,
  note: z
    .string()
    .trim()
    .max(1000, "Wiadomość może mieć najwyżej 1000 znaków.")
    .transform((value) => value || null),
  consent: v.consent,
  hp: z.string().optional(),
  stamp: z.string().optional(),
})

export type RequestBookingInput = z.input<typeof schema>

export type RequestBookingResult =
  | { ok: true; kod: string }
  | {
      ok: false
      errors: v.FieldErrors
      message?: string
      /** Wolne godziny tego samego dnia, gdy wybrana właśnie przepadła. */
      alternatives?: { startsAt: string; time: string }[]
    }

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export async function requestBooking(
  input: RequestBookingInput
): Promise<RequestBookingResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: v.fieldErrors(parsed.error) }
  }
  const data = parsed.data

  // Bot: pole-pułapka wypełnione albo formularz wysłany szybciej, niż da się
  // go przeczytać. Udajemy sukces, żeby nie podpowiadać, co go zdradziło.
  if (honeypotFilled(data.hp) || !stampLooksHuman(data.stamp)) {
    return { ok: true, kod: "KOR-0000" }
  }

  const ip = await clientIp()
  if (tooManyFromAddress(ip, "booking", { limit: 8 })) {
    return v.failWith(
      "Za dużo zgłoszeń z tego miejsca w krótkim czasie. Spróbuj za godzinę albo zadzwoń."
    )
  }

  const startsAt = new Date(data.startsAt)
  if (Number.isNaN(startsAt.getTime())) {
    return v.fail({ startsAt: "Nieprawidłowy termin." })
  }

  const teacher = await prisma.teacherProfile.findFirst({
    where: { slug: data.teacherSlug, isPublished: true },
    select: {
      id: true,
      userId: true,
      slotMinutes: true,
      user: { select: { firstName: true, lastName: true } },
    },
  })
  if (!teacher) {
    return v.failWith("Nie znaleźliśmy tego nauczyciela.")
  }

  const [subject, level, settings] = await Promise.all([
    data.subjectSlug
      ? prisma.subject.findFirst({
          where: { slug: data.subjectSlug, isActive: true },
          select: { id: true, name: true },
        })
      : null,
    data.levelSlug
      ? prisma.level.findFirst({
          where: { slug: data.levelSlug, isActive: true },
          select: { id: true, name: true },
        })
      : null,
    getSiteSettings(),
  ])

  const recent = await recentBookingCount(data.email, data.phone)
  if (recent >= 5) {
    return v.failWith(
      "Z tego kontaktu poszło już kilka zgłoszeń w ostatniej godzinie. Poczekaj chwilę albo zadzwoń."
    )
  }

  // Autorytatywne sprawdzenie: czy ta godzina naprawdę jest wolna teraz.
  // Ta sama funkcja liczy grafik na stronie, więc reguły nie mogą się rozjechać.
  const board = await getSlotBoard({
    teacherProfileId: teacher.id,
    from: startOfDay(startsAt),
    days: 1,
  })
  const iso = startsAt.toISOString()
  const slot = board.slots.find((item) => item.startsAt === iso)

  if (!slot) {
    const alternatives = board.slots.map((item) => ({
      startsAt: item.startsAt,
      time: item.time,
    }))
    return {
      ok: false,
      errors: {
        startsAt:
          alternatives.length > 0
            ? "Ten termin właśnie przestał być wolny. Wybierz inną godzinę tego dnia."
            : "Ten termin nie jest już wolny.",
      },
      alternatives,
    }
  }

  const endsAt = new Date(startsAt.getTime() + slot.minutes * 60_000)

  // Druga siatka bezpieczeństwa: kolizja liczona wprost z bazy, razem
  // z oczekującymi zgłoszeniami i spotkaniami grup.
  const conflicts = await findScheduleConflicts({
    teacherProfileId: teacher.id,
    startsAt,
    endsAt,
    statuses: ["PENDING", "CONFIRMED"],
  })
  if (conflicts.length > 0) {
    return {
      ok: false,
      errors: { startsAt: conflictMessage(conflicts) },
      alternatives: board.slots
        .filter((item) => item.startsAt !== iso)
        .map((item) => ({ startsAt: item.startsAt, time: item.time })),
    }
  }

  const priceRules = await getPriceRules()
  const hourly = resolveHourlyPrice(priceRules, {
    levelId: level?.id ?? null,
    subjectId: subject?.id ?? null,
    teacherProfileId: teacher.id,
  })

  // Zalogowany uczeń dostaje rezerwację przypiętą do konta. Anonim zostaje
  // gościem — nie przypinamy zgłoszenia do cudzego konta tylko dlatego, że
  // ktoś wpisał jego adres. Ucznia założonego ręcznie w panelu (bez konta
  // w Clerku) wolno dopiąć, bo to ten sam człowiek wracający po lekcję.
  const clerkUser = await currentUser()
  let studentId: string | null = null

  if (clerkUser) {
    const account = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { id: true },
    })
    studentId = account?.id ?? null
  } else if (data.email) {
    const known = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, clerkId: true },
    })
    if (known && !known.clerkId) studentId = known.id
  }

  const booking = await prisma.booking.create({
    data: {
      reference: await uniqueBookingReference(),
      teacherProfileId: teacher.id,
      studentId,
      guestName: studentId ? null : data.name,
      guestEmail: studentId ? null : data.email,
      guestPhone: data.phone,
      subjectId: subject?.id ?? null,
      levelId: level?.id ?? null,
      locationId: slot.locationId,
      mode: slot.mode ?? "ONLINE",
      startsAt,
      endsAt,
      price: hourly === null ? null : lessonPrice(hourly, slot.minutes),
      status: settings.bookingAutoConfirm ? "CONFIRMED" : "PENDING",
      confirmedAt: settings.bookingAutoConfirm ? new Date() : null,
      studentNote: data.note,
    },
    select: { id: true, reference: true },
  })

  // Uczeń wpisany ręcznie w panelu mógł nie mieć telefonu — teraz go podał.
  if (studentId) {
    await prisma.user
      .update({
        where: { id: studentId },
        data: { phone: data.phone, ...splitName(data.name) },
      })
      .catch(() => {})
  }

  await notify({
    type: "BOOKING_CREATED",
    title: "Nowe zgłoszenie ze strony",
    message: `${data.name} · ${formatLongDate(startsAt)}, ${formatTime(startsAt)}${subject ? ` · ${subject.name}` : ""}`,
    link: `/dashboard/rezerwacje/${booking.id}`,
    userId: teacher.userId,
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/rezerwacje")
  revalidatePath("/dashboard/kalendarz")

  return { ok: true, kod: booking.reference }
}

const cancelSchema = z.object({
  reference: v.referenceCode,
  reason: z
    .string()
    .trim()
    .max(300, "Powód może mieć najwyżej 300 znaków.")
    .transform((value) => value || null),
})

export type CancelBookingResult =
  | { ok: true }
  | { ok: false; errors: v.FieldErrors; message?: string }

/**
 * Odwołanie przez ucznia. Kod rezerwacji jest kluczem dostępu — kto go zna,
 * ten zgłaszał albo dostał go od zgłaszającego.
 */
export async function cancelOwnBooking(input: {
  reference: string
  reason: string
}): Promise<CancelBookingResult> {
  const parsed = cancelSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: v.fieldErrors(parsed.error) }
  }

  const booking = await prisma.booking.findUnique({
    where: { reference: parsed.data.reference },
    select: {
      id: true,
      status: true,
      startsAt: true,
      teacherProfile: { select: { userId: true, minLeadHours: true } },
    },
  })
  if (!booking) {
    return v.failWith("Nie znaleźliśmy rezerwacji o tym kodzie.")
  }

  if (["CANCELLED", "REJECTED", "COMPLETED", "NO_SHOW"].includes(booking.status)) {
    return v.failWith("Tej rezerwacji nie da się już odwołać.")
  }

  const settings = await getSiteSettings()
  const leadHours = Math.max(
    booking.teacherProfile.minLeadHours,
    settings.bookingMinLeadHours
  )
  const deadline = new Date(
    booking.startsAt.getTime() - leadHours * 3_600_000
  )
  if (new Date() > deadline) {
    return v.failWith(
      `Odwołanie przez stronę działa do ${leadHours} h przed lekcją. Zadzwoń albo napisz — dogadamy to bezpośrednio.`
    )
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      statusReason: parsed.data.reason ?? "Odwołane przez ucznia",
    },
  })

  await notify({
    type: "BOOKING_CANCELLED",
    title: "Uczeń odwołał lekcję",
    message: `${formatLongDate(booking.startsAt)}, ${formatTime(booking.startsAt)}`,
    link: `/dashboard/rezerwacje/${booking.id}`,
    userId: booking.teacherProfile.userId,
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/rezerwacje")
  revalidatePath("/dashboard/kalendarz")

  return { ok: true }
}
