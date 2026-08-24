"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin, requireTeacherAccess } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uniqueSlug } from "@/lib/slug"

function refresh(teacherProfileId: string) {
  revalidatePath("/dashboard/nauczyciele")
  revalidatePath(`/dashboard/nauczyciele/${teacherProfileId}`)
}

export type TeacherProfileInput = {
  headline: string | null
  bio: string | null
  education: string | null
  experienceYears: number | null
  isPublished: boolean
  isAcceptingStudents: boolean
  order: number
}

export async function updateTeacherProfile(
  teacherProfileId: string,
  input: TeacherProfileInput
) {
  await requireTeacherAccess(teacherProfileId)

  if (
    input.experienceYears !== null &&
    (input.experienceYears < 0 || input.experienceYears > 70)
  ) {
    throw new Error("Lata doświadczenia muszą mieścić się między 0 a 70.")
  }

  await prisma.teacherProfile.update({
    where: { id: teacherProfileId },
    data: {
      headline: input.headline?.trim() || null,
      bio: input.bio?.trim() || null,
      education: input.education?.trim() || null,
      experienceYears: input.experienceYears,
      isPublished: input.isPublished,
      isAcceptingStudents: input.isAcceptingStudents,
      order: input.order,
    },
  })
  refresh(teacherProfileId)
}

/** Adres profilu na stronie — zmiana psuje stare linki, więc tylko admin. */
export async function updateTeacherSlug(
  teacherProfileId: string,
  slug: string
) {
  await requireAdmin()

  const clean = await uniqueSlug(
    slug,
    async (candidate) => {
      const found = await prisma.teacherProfile.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
      return found?.id ?? null
    },
    { fallback: "nauczyciel", currentId: teacherProfileId }
  )

  await prisma.teacherProfile.update({
    where: { id: teacherProfileId },
    data: { slug: clean },
  })
  refresh(teacherProfileId)
  return clean
}

export type TeacherSubjectInput = {
  subjectId: string
  levelIds: string[]
  note: string | null
  isActive: boolean
}

export async function saveTeacherSubject(
  teacherProfileId: string,
  input: TeacherSubjectInput
) {
  await requireTeacherAccess(teacherProfileId)

  const subject = await prisma.subject.findUnique({
    where: { id: input.subjectId },
    select: { id: true },
  })
  if (!subject) throw new Error("Nie znaleziono przedmiotu.")

  await prisma.teacherSubject.upsert({
    where: {
      teacherProfileId_subjectId: {
        teacherProfileId,
        subjectId: input.subjectId,
      },
    },
    update: {
      note: input.note?.trim() || null,
      isActive: input.isActive,
      levels: { set: input.levelIds.map((id) => ({ id })) },
    },
    create: {
      teacherProfileId,
      subjectId: input.subjectId,
      note: input.note?.trim() || null,
      isActive: input.isActive,
      levels: { connect: input.levelIds.map((id) => ({ id })) },
    },
  })
  refresh(teacherProfileId)
  revalidatePath("/dashboard/przedmioty")
  revalidatePath("/dashboard/cennik")
}

export async function removeTeacherSubject(teacherSubjectId: string) {
  const link = await prisma.teacherSubject.findUnique({
    where: { id: teacherSubjectId },
    select: { teacherProfileId: true, subjectId: true },
  })
  if (!link) throw new Error("Nie znaleziono przypisania.")
  await requireTeacherAccess(link.teacherProfileId)

  // Historia rezerwacji wisi na Booking.subjectId, więc odpięcie jej nie rusza.
  await prisma.teacherSubject.delete({ where: { id: teacherSubjectId } })
  refresh(link.teacherProfileId)
  revalidatePath("/dashboard/przedmioty")
}
