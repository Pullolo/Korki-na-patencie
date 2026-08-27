import { formatLongDate, formatTime, personName } from "@/lib/format"
import { prisma } from "@/lib/prisma"

/**
 * Rezerwacje widziane od strony ucznia.
 *
 * Kod rezerwacji jest kluczem dostępu: kto go zna, ten zgłaszał albo dostał
 * go od zgłaszającego. Dlatego zwracamy tylko to, co potrzebne do sprawdzenia
 * statusu — bez notatek wewnętrznych i bez danych innych osób.
 *
 * Nigdy z cache'a: status zmienia się w panelu i musi być widoczny od razu.
 */

export type PublicBooking = {
  reference: string
  status: string
  startsAt: Date
  endsAt: Date
  minutes: number
  price: number | null
  studentNote: string | null
  statusReason: string | null
  dayLabel: string
  timeLabel: string
  teacher: { name: string; slug: string }
  subject: { name: string; slug: string } | null
  level: { name: string } | null
  location: { name: string; type: string; city: string | null } | null
  mode: string
  studentName: string
  /** Do kiedy uczeń może odwołać lekcję sam ze strony. */
  cancelDeadline: Date
}

export async function getBookingByReference(
  reference: string
): Promise<PublicBooking | null> {
  const booking = await prisma.booking.findUnique({
    where: { reference: reference.toUpperCase() },
    select: {
      reference: true,
      status: true,
      startsAt: true,
      endsAt: true,
      price: true,
      mode: true,
      studentNote: true,
      statusReason: true,
      guestName: true,
      student: { select: { firstName: true, lastName: true, email: true } },
      teacherProfile: {
        select: {
          slug: true,
          minLeadHours: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      subject: { select: { name: true, slug: true } },
      level: { select: { name: true } },
      location: { select: { name: true, type: true, city: true } },
    },
  })
  if (!booking) return null

  const minutes = Math.round(
    (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000
  )

  return {
    reference: booking.reference,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    minutes,
    price: booking.price,
    studentNote: booking.studentNote,
    statusReason: booking.statusReason,
    dayLabel: formatLongDate(booking.startsAt),
    timeLabel: formatTime(booking.startsAt),
    teacher: {
      slug: booking.teacherProfile.slug,
      name: personName(booking.teacherProfile.user),
    },
    subject: booking.subject,
    level: booking.level,
    location: booking.location,
    mode: booking.mode,
    studentName: booking.student
      ? personName(booking.student)
      : (booking.guestName ?? "Uczeń"),
    cancelDeadline: new Date(
      booking.startsAt.getTime() -
        booking.teacherProfile.minLeadHours * 3_600_000
    ),
  }
}

/** Lekcje zalogowanego ucznia — do `/konto`. */
export async function listMyBookings(userId: string) {
  return prisma.booking.findMany({
    where: { studentId: userId },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      reference: true,
      status: true,
      startsAt: true,
      endsAt: true,
      price: true,
      mode: true,
      teacherProfile: {
        select: {
          slug: true,
          minLeadHours: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      subject: { select: { name: true, slug: true } },
      level: { select: { name: true } },
      location: { select: { name: true, type: true, city: true } },
      review: { select: { id: true, status: true } },
    },
  })
}
