"use server"

import { revalidatePath } from "next/cache"

import { requireDashboardUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
