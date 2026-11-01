"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { requireTeacherAccess } from "@/lib/auth"
import { conflictMessage, findScheduleConflicts } from "@/lib/conflicts"
import { bookingDecisionMail, sendEmail } from "@/lib/email"
import { formatLongDate, formatTime, personName } from "@/lib/format"
import { getSiteSettings } from "@/lib/public/settings"
import { BOOKING_STATUS_LABELS } from "@/lib/labels"
import type { BookingStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/**
 * Z którego statusu wolno przejść do którego.
 *
 * Przyciski w panelu i tak pokazują tylko sensowne akcje, ale UI nie jest
 * bramką: wystarczy druga otwarta karta, w której rezerwacja została już
 * odwołana, żeby kliknięcie „Potwierdź" wskrzesiło ją bez śladu. Rozliczoną
 * lekcję cofa się świadomie, przez „Cofnij decyzję".
 */
const ALLOWED_FROM: Record<string, BookingStatus[]> = {
  confirm: ["PENDING"],
  reject: ["PENDING"],
  cancel: ["PENDING", "CONFIRMED"],
  complete: ["CONFIRMED"],
  noShow: ["CONFIRMED"],
}

function assertTransition(
  action: keyof typeof ALLOWED_FROM,
  status: BookingStatus
) {
  if (ALLOWED_FROM[action].includes(status)) return
  throw new Error(
    `Rezerwacja ma status „${BOOKING_STATUS_LABELS[status]}" — ta akcja nie jest już dostępna. Odśwież stronę.`
  )
}

/** Lekcji, która się jeszcze nie zaczęła, nie da się rozliczyć ani odhaczyć nieobecności. */
function assertAlreadyStarted(startsAt: Date) {
  if (startsAt <= new Date()) return
  throw new Error("Ta lekcja jeszcze się nie zaczęła.")
}

async function loadBookingForUpdate(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      teacherProfileId: true,
      status: true,
      startsAt: true,
      endsAt: true,
    },
  })
  if (!booking) throw new Error("Nie znaleziono rezerwacji.")
  // Nauczyciel może ruszać tylko swoje rezerwacje, admin wszystkie.
  await requireTeacherAccess(booking.teacherProfileId)
  return booking
}

/**
 * Decyzja nauczyciela musi dojść do ucznia sama.
 *
 * Bez maila uczeń nie ma jak się dowiedzieć, że jego termin został
 * potwierdzony albo odwołany — musiałby sam wracać na stronę pod kodem.
 * Idzie po odpowiedzi (`after`), bo panel nie ma czekać na dostawcę poczty,
 * i nigdy nie rzuca: zmiana statusu jest już zapisana.
 */
async function mailDecision(
  bookingId: string,
  decision: "CONFIRMED" | "REJECTED" | "CANCELLED",
  reason: string | null
) {
  after(async () => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          reference: true,
          startsAt: true,
          guestEmail: true,
          student: { select: { email: true } },
          subject: { select: { name: true } },
          teacherProfile: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      })
      const to = booking?.student?.email ?? booking?.guestEmail
      if (!booking || !to) return

      const settings = await getSiteSettings()
      await sendEmail({
        to,
        ...bookingDecisionMail({
          reference: booking.reference,
          dayLabel: formatLongDate(booking.startsAt),
          timeLabel: formatTime(booking.startsAt),
          teacherName: personName(booking.teacherProfile.user),
          subjectName: booking.subject?.name ?? null,
          siteName: settings.siteName,
          decision,
          reason,
        }),
      })
    } catch (error) {
      console.error("Nie udało się powiadomić ucznia o decyzji:", error)
    }
  })
}

function refresh(bookingId?: string) {
  if (bookingId) revalidatePath(`/dashboard/rezerwacje/${bookingId}`)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/rezerwacje")
  revalidatePath("/dashboard/kalendarz")
}

export async function confirmBooking(bookingId: string) {
  const booking = await loadBookingForUpdate(bookingId)
  assertTransition("confirm", booking.status)

  // Dwie rezerwacje na ten sam termin u tego samego nauczyciela to realny scenariusz,
  // bo do potwierdzenia termin nikomu nie jest zablokowany. Godziny grup liczą
  // się tak samo jak potwierdzone lekcje — sprawdza to `findScheduleConflicts()`.
  const conflicts = await findScheduleConflicts({
    teacherProfileId: booking.teacherProfileId,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    ignoreBookingId: booking.id,
  })
  if (conflicts.length > 0) throw new Error(conflictMessage(conflicts))

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", confirmedAt: new Date(), statusReason: null },
  })
  await mailDecision(booking.id, "CONFIRMED", null)
  refresh(booking.id)
}

export async function rejectBooking(bookingId: string, reason?: string) {
  const booking = await loadBookingForUpdate(bookingId)
  assertTransition("reject", booking.status)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "REJECTED", statusReason: reason || null },
  })
  await mailDecision(booking.id, "REJECTED", reason || null)
  refresh(booking.id)
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const booking = await loadBookingForUpdate(bookingId)
  assertTransition("cancel", booking.status)
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      statusReason: reason || null,
    },
  })
  await mailDecision(booking.id, "CANCELLED", reason || null)
  refresh(booking.id)
}

export async function completeBooking(bookingId: string) {
  const booking = await loadBookingForUpdate(bookingId)
  assertTransition("complete", booking.status)
  assertAlreadyStarted(booking.startsAt)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "COMPLETED" },
  })
  refresh(booking.id)
}

export async function markNoShow(bookingId: string) {
  const booking = await loadBookingForUpdate(bookingId)
  assertTransition("noShow", booking.status)
  assertAlreadyStarted(booking.startsAt)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "NO_SHOW" },
  })
  refresh(booking.id)
}

export async function updateInternalNote(bookingId: string, note: string) {
  const booking = await loadBookingForUpdate(bookingId)
  await prisma.booking.update({
    where: { id: booking.id },
    data: { internalNote: note.trim() || null },
  })
  revalidatePath(`/dashboard/rezerwacje/${booking.id}`)
}

/** Cofnięcie decyzji — rezerwacja wraca do kolejki oczekujących. */
export async function reopenBooking(bookingId: string) {
  const booking = await loadBookingForUpdate(bookingId)
  if (booking.status === "PENDING") return

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "PENDING",
      confirmedAt: null,
      cancelledAt: null,
      statusReason: null,
    },
  })
  refresh()
  revalidatePath(`/dashboard/rezerwacje/${booking.id}`)
}
