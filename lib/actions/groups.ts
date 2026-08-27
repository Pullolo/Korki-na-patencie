"use server"

import { revalidatePath } from "next/cache"

import { requireTeacherAccess } from "@/lib/auth"
import { toDateOnly } from "@/lib/dates"
import type { EnrollmentInput } from "@/lib/enrollment"
import { enrollStudent } from "@/lib/enrollment"
import type { EnrollmentStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { revalidateTags, TAGS } from "@/lib/tags"
import { uniqueSlug } from "@/lib/slug"

function refresh() {
  revalidatePath("/dashboard/grupy")
  revalidateTags(TAGS.grupy)
  revalidatePath("/dashboard/cennik")
  revalidatePath("/dashboard/dostepnosc")
  revalidatePath("/dashboard/kalendarz")
}

export type CourseGroupInput = {
  name: string
  subjectId: string | null
  levelId: string | null
  description: string | null
  minSeats: number
  maxSeats: number
  meetingsPerMonth: number
  meetingMinutes: number
  pricePerMonth: number
  weekday: number
  startMin: number
  locationId: string | null
  isActive: boolean
  isPublished: boolean
}

function validate(input: CourseGroupInput) {
  if (input.name.trim().length < 2) {
    throw new Error("Nazwa grupy musi mieć co najmniej 2 znaki.")
  }
  if (input.minSeats < 1 || input.maxSeats < input.minSeats) {
    throw new Error("Górny limit miejsc nie może być mniejszy niż dolny.")
  }
  if (input.maxSeats > 50) {
    throw new Error("Grupa nie może mieć więcej niż 50 miejsc.")
  }
  if (input.meetingsPerMonth < 1 || input.meetingsPerMonth > 31) {
    throw new Error("Liczba spotkań w miesiącu musi mieścić się między 1 a 31.")
  }
  if (input.meetingMinutes < 15 || input.meetingMinutes > 480) {
    throw new Error("Spotkanie musi trwać od 15 do 480 minut.")
  }
  if (input.pricePerMonth <= 0 || input.pricePerMonth > 100_000) {
    throw new Error("Cena miesięczna musi mieścić się między 1 a 100 000.")
  }
  if (input.weekday < 1 || input.weekday > 7) {
    throw new Error("Nieprawidłowy dzień tygodnia.")
  }
  if (input.startMin < 0 || input.startMin + input.meetingMinutes > 24 * 60) {
    throw new Error("Spotkanie musi mieścić się w dobie.")
  }
}

async function assertLocation(
  teacherProfileId: string,
  locationId: string | null
) {
  if (!locationId) return
  const location = await prisma.location.findFirst({
    where: { id: locationId, teacherProfileId },
    select: { id: true },
  })
  if (!location) {
    throw new Error("Wybrana lokalizacja nie należy do tego nauczyciela.")
  }
}

export async function createCourseGroup(
  teacherProfileId: string,
  input: CourseGroupInput
) {
  await requireTeacherAccess(teacherProfileId)
  validate(input)
  await assertLocation(teacherProfileId, input.locationId)

  await prisma.courseGroup.create({
    data: {
      teacherProfileId,
      name: input.name.trim(),
      slug: await uniqueSlug(
        input.name,
        async (slug) => {
          const found = await prisma.courseGroup.findUnique({
            where: { slug },
            select: { id: true },
          })
          return found?.id ?? null
        },
        { fallback: "grupa" }
      ),
      subjectId: input.subjectId,
      levelId: input.levelId,
      description: input.description?.trim() || null,
      minSeats: input.minSeats,
      maxSeats: input.maxSeats,
      meetingsPerMonth: input.meetingsPerMonth,
      meetingMinutes: input.meetingMinutes,
      pricePerMonth: input.pricePerMonth,
      weekday: input.weekday,
      startMin: input.startMin,
      locationId: input.locationId,
      isActive: input.isActive,
      isPublished: input.isPublished,
    },
  })
  refresh()
}

export async function updateCourseGroup(id: string, input: CourseGroupInput) {
  const group = await prisma.courseGroup.findUnique({
    where: { id },
    select: { teacherProfileId: true },
  })
  if (!group) throw new Error("Nie znaleziono grupy.")
  await requireTeacherAccess(group.teacherProfileId)
  validate(input)
  await assertLocation(group.teacherProfileId, input.locationId)

  await prisma.courseGroup.update({
    where: { id },
    data: {
      name: input.name.trim(),
      subjectId: input.subjectId,
      levelId: input.levelId,
      description: input.description?.trim() || null,
      minSeats: input.minSeats,
      maxSeats: input.maxSeats,
      meetingsPerMonth: input.meetingsPerMonth,
      meetingMinutes: input.meetingMinutes,
      pricePerMonth: input.pricePerMonth,
      weekday: input.weekday,
      startMin: input.startMin,
      locationId: input.locationId,
      isActive: input.isActive,
      isPublished: input.isPublished,
    },
  })
  refresh()
}

export async function deleteCourseGroup(id: string) {
  const group = await prisma.courseGroup.findUnique({
    where: { id },
    select: {
      teacherProfileId: true,
      _count: { select: { enrollments: true } },
    },
  })
  if (!group) throw new Error("Nie znaleziono grupy.")
  await requireTeacherAccess(group.teacherProfileId)

  if (group._count.enrollments > 0) {
    throw new Error(
      "Grupa ma zapisanych uczniów — zamiast kasować, wyłącz ją przełącznikiem."
    )
  }

  await prisma.courseGroup.delete({ where: { id } })
  refresh()
}

export type { EnrollmentInput } from "@/lib/enrollment"

/**
 * Zapis ucznia przez nauczyciela. Reguły (rabat, limit miejsc, lista
 * rezerwowa, migawka ceny) są wspólne z formularzem na stronie — tutaj
 * dokładamy tylko bramkę autoryzacji.
 */
export async function enrollInGroup(groupId: string, input: EnrollmentInput) {
  const group = await prisma.courseGroup.findUnique({
    where: { id: groupId },
    select: { teacherProfileId: true },
  })
  if (!group) throw new Error("Nie znaleziono grupy.")
  await requireTeacherAccess(group.teacherProfileId)

  const result = await enrollStudent(groupId, input)
  refresh()
  return result
}

export async function setEnrollmentStatus(
  id: string,
  status: EnrollmentStatus
) {
  const enrollment = await prisma.groupEnrollment.findUnique({
    where: { id },
    select: { group: { select: { teacherProfileId: true } } },
  })
  if (!enrollment) throw new Error("Nie znaleziono zapisu.")
  await requireTeacherAccess(enrollment.group.teacherProfileId)

  await prisma.groupEnrollment.update({
    where: { id },
    data: {
      status,
      endedOn:
        status === "CANCELLED" || status === "FINISHED"
          ? toDateOnly(new Date())
          : null,
    },
  })
  refresh()
}

export async function removeEnrollment(id: string) {
  const enrollment = await prisma.groupEnrollment.findUnique({
    where: { id },
    select: { group: { select: { teacherProfileId: true } } },
  })
  if (!enrollment) throw new Error("Nie znaleziono zapisu.")
  await requireTeacherAccess(enrollment.group.teacherProfileId)

  await prisma.groupEnrollment.delete({ where: { id } })
  refresh()
}
