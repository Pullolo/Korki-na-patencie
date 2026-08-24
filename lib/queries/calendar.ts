import { startOfWeek } from "date-fns"

import { computeAvailability } from "@/lib/availability"
import type { BookingStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { getTeacherSchedule } from "@/lib/queries/availability"

/** Odwołane i odrzucone nie zajmują miejsca w grafiku, więc ich nie rysujemy. */
const VISIBLE_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
]

const BUSY_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED"]

export type CalendarBooking = {
  id: string
  reference: string
  status: BookingStatus
  startsAt: Date
  endsAt: Date
  studentName: string
  subjectName: string | null
  teacherName: string
}

export type CalendarFreeSlot = {
  startsAt: Date
  endsAt: Date
}

/** Poniedziałek tygodnia, w którym leży podana data. */
export function weekStartFor(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function personName(user: {
  firstName: string | null
  lastName: string | null
  email?: string
}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "—"
}

function studentNameOf(booking: {
  guestName: string | null
  student: {
    firstName: string | null
    lastName: string | null
    email: string
  } | null
}) {
  if (booking.student) {
    return (
      [booking.student.firstName, booking.student.lastName]
        .filter(Boolean)
        .join(" ") || booking.student.email
    )
  }
  return booking.guestName || "Gość"
}

/**
 * Lekcje i wolne okienka na jeden tydzień.
 * `teacherProfileId === null` to widok admina „wszyscy nauczyciele" —
 * wtedy nie liczymy wolnych terminów, bo każdy nauczyciel ma własny grafik.
 */
export async function getWeekSchedule(
  teacherProfileId: string | null,
  weekStart: Date
): Promise<{ bookings: CalendarBooking[]; freeSlots: CalendarFreeSlot[] }> {
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000)

  const rows = await prisma.booking.findMany({
    where: {
      ...(teacherProfileId ? { teacherProfileId } : {}),
      status: { in: VISIBLE_STATUSES },
      startsAt: { gte: weekStart, lt: weekEnd },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      reference: true,
      status: true,
      startsAt: true,
      endsAt: true,
      guestName: true,
      student: { select: { firstName: true, lastName: true, email: true } },
      subject: { select: { name: true } },
      teacherProfile: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  const bookings: CalendarBooking[] = rows.map((booking) => ({
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    studentName: studentNameOf(booking),
    subjectName: booking.subject?.name ?? null,
    teacherName: personName(booking.teacherProfile.user),
  }))

  if (!teacherProfileId) return { bookings, freeSlots: [] }

  const profile = await getTeacherSchedule(teacherProfileId)
  if (!profile) return { bookings, freeSlots: [] }

  const busy = await prisma.booking.findMany({
    where: {
      teacherProfileId,
      status: { in: BUSY_STATUSES },
      startsAt: { lt: weekEnd },
      endsAt: { gt: weekStart },
    },
    select: { startsAt: true, endsAt: true },
  })

  const days = computeAvailability({
    from: weekStart,
    days: 7,
    rules: profile.availabilityRules,
    exceptions: profile.availabilityExceptions,
    busy,
    settings: {
      slotMinutes: profile.slotMinutes,
      bufferMinutes: profile.bufferMinutes,
      minLeadHours: profile.minLeadHours,
      maxAdvanceDays: profile.maxAdvanceDays,
    },
  })

  const freeSlots = days.flatMap((day) =>
    day.slots.map((slot) => ({ startsAt: slot.startsAt, endsAt: slot.endsAt }))
  )

  return { bookings, freeSlots }
}
