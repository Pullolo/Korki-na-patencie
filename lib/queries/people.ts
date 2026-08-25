import type { DashboardContext } from "@/lib/auth"
import type { Prisma } from "@/lib/generated/prisma/client"
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

export const USER_SORT_KEYS = ["nazwa", "rola", "profil", "data"] as const
export type UserSortKey = (typeof USER_SORT_KEYS)[number]
export type SortDirection = "asc" | "desc"

/** Ile kont pokazujemy naraz — resztę zawęża wyszukiwarka. */
export const USERS_LIMIT = 200

/**
 * Każde słowo frazy musi trafić w imię, nazwisko albo mail, więc „kowalska anna”
 * znajduje to samo co „anna kowalska”.
 */
function userSearchWhere(search: string): Prisma.UserWhereInput {
  const words = search.split(/\s+/).filter(Boolean).slice(0, 5)
  return {
    AND: words.map((word): Prisma.UserWhereInput => {
      const match = { contains: word, mode: "insensitive" } as const
      return {
        OR: [{ firstName: match }, { lastName: match }, { email: match }],
      }
    }),
  }
}

function userOrderBy(
  sort: UserSortKey,
  dir: SortDirection
): Prisma.UserOrderByWithRelationInput[] {
  switch (sort) {
    case "nazwa":
      // Konta bez imienia lądują na końcu niezależnie od kierunku.
      return [
        { firstName: { sort: dir, nulls: "last" } },
        { lastName: { sort: dir, nulls: "last" } },
        { email: { sort: dir, nulls: "last" } },
      ]
    case "rola":
      // Kolejność enuma w bazie: ADMIN, TEACHER, STUDENT.
      return [{ role: dir }, { createdAt: "desc" }]
    case "profil":
      // Brak profilu to NULL z LEFT JOINa: rosnąco najpierw konta z profilem,
      // malejąco — te bez niego.
      return [{ teacherProfile: { createdAt: dir } }, { createdAt: "desc" }]
    case "data":
      return [{ createdAt: dir }]
  }
}

/**
 * Lista kont dla admina. Filtrujemy i sortujemy w bazie, żeby limit obcinał
 * dopiero wynik wyszukiwania, a nie przypadkowe 200 najnowszych kont.
 */
export async function getUsers(
  options: {
    search?: string
    sort?: UserSortKey
    dir?: SortDirection
  } = {}
) {
  const search = options.search?.trim() ?? ""
  const where = search ? userSearchWhere(search) : {}

  const [users, matching] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: userOrderBy(options.sort ?? "data", options.dir ?? "desc"),
      take: USERS_LIMIT,
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
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    /** Ile kont pasuje do frazy — bez limitu strony. */
    matching,
    total: search ? await prisma.user.count() : matching,
  }
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
