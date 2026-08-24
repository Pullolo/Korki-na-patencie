import { prisma } from "@/lib/prisma"

export async function getSubjects() {
  return prisma.subject.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      isActive: true,
      order: true,
      _count: { select: { teacherSubjects: true, bookings: true } },
    },
  })
}

export async function getLevels() {
  return prisma.level.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, order: true, isActive: true },
  })
}

/** Lokalizacje należą do nauczycieli, więc zwracamy je pogrupowane po profilu. */
export async function getLocationsByTeacher() {
  return prisma.teacherProfile.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      locations: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          address: true,
          note: true,
          isActive: true,
          order: true,
        },
      },
    },
  })
}
