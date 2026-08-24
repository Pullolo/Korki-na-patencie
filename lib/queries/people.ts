import type { DashboardContext } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getTeachers() {
  return prisma.teacherProfile.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      headline: true,
      slotMinutes: true,
      isPublished: true,
      isAcceptingStudents: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
      subjects: {
        where: { isActive: true },
        select: {
          subject: { select: { id: true, name: true } },
          levels: { select: { id: true } },
        },
      },
      locations: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, name: true, type: true, city: true },
      },
      _count: { select: { bookings: true, availabilityRules: true } },
    },
  })
}

/**
 * Uczniowie z kontem. Rezerwacje gości (bez konta) celowo tu nie trafiają —
 * widać je na liście rezerwacji.
 */
export async function getStudents(ctx: DashboardContext) {
  return prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(ctx.isAdmin
        ? {}
        : {
            bookings: {
              some: { teacherProfileId: ctx.teacherProfileId ?? "__brak__" },
            },
          }),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      imageUrl: true,
      createdAt: true,
      studentProfile: {
        select: { schoolClass: true, level: { select: { name: true } } },
      },
      _count: { select: { bookings: true } },
    },
  })
}

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      role: true,
      createdAt: true,
      teacherProfile: { select: { id: true, slug: true } },
    },
  })
}

/** Pełny profil nauczyciela na stronę szczegółów. */
export async function getTeacherProfile(id: string) {
  return prisma.teacherProfile.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      headline: true,
      bio: true,
      education: true,
      experienceYears: true,
      isPublished: true,
      isAcceptingStudents: true,
      order: true,
      slotMinutes: true,
      bufferMinutes: true,
      minLeadHours: true,
      maxAdvanceDays: true,
      user: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
      subjects: {
        orderBy: { subject: { order: "asc" } },
        select: {
          id: true,
          note: true,
          isActive: true,
          subject: { select: { id: true, name: true } },
          levels: { select: { id: true } },
        },
      },
      locations: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          address: true,
          city: true,
          note: true,
          isActive: true,
          order: true,
        },
      },
      _count: {
        select: { bookings: true, availabilityRules: true, reviews: true },
      },
    },
  })
}

/**
 * Karta ucznia. Nauczyciel widzi ją tylko wtedy, gdy ma z tym uczniem
 * jakąkolwiek rezerwację — inaczej dostaje null i stronę 404.
 */
export async function getStudentDetail(ctx: DashboardContext, userId: string) {
  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "STUDENT",
      ...(ctx.isAdmin
        ? {}
        : {
            bookings: {
              some: { teacherProfileId: ctx.teacherProfileId ?? "__brak__" },
            },
          }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      studentProfile: {
        select: {
          levelId: true,
          schoolName: true,
          schoolClass: true,
          guardianName: true,
          guardianPhone: true,
          notes: true,
        },
      },
    },
  })
  if (!student) return null

  const bookings = await prisma.booking.findMany({
    where: {
      studentId: userId,
      ...(ctx.isAdmin
        ? {}
        : { teacherProfileId: ctx.teacherProfileId ?? "__brak__" }),
    },
    orderBy: { startsAt: "desc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      status: true,
      startsAt: true,
      endsAt: true,
      price: true,
      subject: { select: { name: true } },
      teacherProfile: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  const completed = bookings.filter((booking) => booking.status === "COMPLETED")

  return {
    student,
    bookings,
    totals: {
      lessons: completed.length,
      spent: completed.reduce((sum, booking) => sum + (booking.price ?? 0), 0),
    },
  }
}
