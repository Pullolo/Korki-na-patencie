import { prisma } from "@/lib/prisma"

/**
 * Dane konta ucznia. Zawsze świeże — status rezerwacji zmienia się w panelu
 * i uczeń musi go widzieć od razu, a nie po wygaśnięciu cache'a.
 *
 * Każde zapytanie jest zawężone identyfikatorem zalogowanej osoby: to jedyna
 * bramka, jaką ma ta warstwa.
 */

export async function getMyBookings(userId: string) {
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
      studentNote: true,
      statusReason: true,
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

export async function getMyEnrollments(userId: string) {
  return prisma.groupEnrollment.findMany({
    where: { studentId: userId },
    orderBy: [{ status: "asc" }, { startedOn: "desc" }],
    select: {
      id: true,
      reference: true,
      status: true,
      monthlyPrice: true,
      discountPercent: true,
      startedOn: true,
      endedOn: true,
      group: {
        select: {
          name: true,
          slug: true,
          weekday: true,
          startMin: true,
          meetingsPerMonth: true,
          meetingMinutes: true,
          subject: { select: { name: true } },
          level: { select: { name: true } },
          teacherProfile: {
            select: {
              slug: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  })
}

export async function getMyProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      studentProfile: {
        select: {
          levelId: true,
          schoolName: true,
          schoolClass: true,
          guardianName: true,
          guardianPhone: true,
        },
      },
    },
  })
}
