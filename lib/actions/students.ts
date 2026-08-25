"use server"

import { revalidatePath } from "next/cache"

import { requireDashboardUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type StudentMatch = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
}

/**
 * Podpowiedzi do pola „Uczeń" przy ręcznym zapisie lekcji. Nauczyciel widzi
 * tylko osoby, które już u niego były — pełną listę ma admin. Duplikatom przy
 * ponownym telefonie zapobiega i tak `createBooking()`, dopasowując po mailu
 * i telefonie, więc zawężenie listy niczego nie psuje.
 */
export async function searchStudents(query: string): Promise<StudentMatch[]> {
  const ctx = await requireDashboardUser()
  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0 || query.trim().length < 2) return []

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
      // Każde słowo musi trafić w któreś z pól — „Jan Kow" znajdzie Jana Kowalskiego.
      AND: terms.map((term) => ({
        OR: [
          { firstName: { contains: term, mode: "insensitive" as const } },
          { lastName: { contains: term, mode: "insensitive" as const } },
          { email: { contains: term, mode: "insensitive" as const } },
          { phone: { contains: term } },
        ],
      })),
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  })
}

export type StudentProfileInput = {
  levelId: string | null
  schoolName: string | null
  schoolClass: string | null
  guardianName: string | null
  guardianPhone: string | null
  notes: string | null
}

function clean(value: string | null) {
  return value?.trim() || null
}

export async function updateStudentProfile(
  userId: string,
  input: StudentProfileInput
) {
  const ctx = await requireDashboardUser()

  // Nauczyciel może notować tylko przy uczniach, których faktycznie uczy.
  if (!ctx.isAdmin) {
    const teaches = await prisma.booking.findFirst({
      where: {
        studentId: userId,
        teacherProfileId: ctx.teacherProfileId ?? "__brak__",
      },
      select: { id: true },
    })
    if (!teaches)
      throw new Error("Ten uczeń nie ma u Ciebie żadnej rezerwacji.")
  }

  const data = {
    levelId: input.levelId || null,
    schoolName: clean(input.schoolName),
    schoolClass: clean(input.schoolClass),
    guardianName: clean(input.guardianName),
    guardianPhone: clean(input.guardianPhone),
    notes: clean(input.notes),
  }

  await prisma.studentProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  })

  revalidatePath(`/dashboard/uczniowie/${userId}`)
  revalidatePath("/dashboard/uczniowie")
}
