import { startOfWeek } from "date-fns"

import { computeAvailability, groupMeetingsInRange } from "@/lib/availability"
import { personName, studentLabel } from "@/lib/format"
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

export type CalendarGroupMeeting = {
  id: string
  name: string
  startsAt: Date
  endsAt: Date
  seats: number
  maxSeats: number
  teacherName: string
}

/** Poniedziałek tygodnia, w którym leży podana data. */
export function weekStartFor(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}

/**
 * Lekcje i wolne okienka na jeden tydzień.
 * `teacherProfileId === null` to widok admina „wszyscy nauczyciele" —
 * wtedy nie liczymy wolnych terminów, bo każdy nauczyciel ma własny grafik.
 */
export async function getWeekSchedule(
  teacherProfileId: string | null,
  weekStart: Date
): Promise<{
  bookings: CalendarBooking[]
  freeSlots: CalendarFreeSlot[]
  groupMeetings: CalendarGroupMeeting[]
}> {
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
    studentName: studentLabel(booking),
    subjectName: booking.subject?.name ?? null,
    teacherName: personName(booking.teacherProfile.user),
  }))

  // Grupy spotykają się cyklicznie — rozwijamy je na konkretne terminy tygodnia.
  const groups = await prisma.courseGroup.findMany({
    where: {
      isActive: true,
      ...(teacherProfileId ? { teacherProfileId } : {}),
    },
    select: {
      id: true,
      name: true,
      weekday: true,
      startMin: true,
      meetingMinutes: true,
      maxSeats: true,
      startsOn: true,
      endsOn: true,
      isActive: true,
      teacherProfile: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  })

  const groupMeetings: CalendarGroupMeeting[] = groups.flatMap((group) =>
    groupMeetingsInRange([group], weekStart, 7).map((meeting) => ({
      id: group.id,
      name: group.name,
      startsAt: meeting.startsAt,
      endsAt: meeting.endsAt,
      seats: group._count.enrollments,
      maxSeats: group.maxSeats,
      teacherName: personName(group.teacherProfile.user),
    }))
  )

  if (!teacherProfileId) return { bookings, freeSlots: [], groupMeetings }

  const profile = await getTeacherSchedule(teacherProfileId)
  if (!profile) return { bookings, freeSlots: [], groupMeetings }

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
    // Godziny grup są zajęte tak samo jak potwierdzone lekcje.
    busy: [...busy, ...groupMeetings],
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

  return { bookings, freeSlots, groupMeetings }
}
