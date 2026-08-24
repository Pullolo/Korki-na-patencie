"use server"

import { revalidatePath } from "next/cache"

import { requireTeacherAccess } from "@/lib/auth"
import { toDateOnly } from "@/lib/dates"
import type { ExceptionType } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

const DAY_MINUTES = 24 * 60

function refresh() {
  revalidatePath("/dashboard/dostepnosc")
  revalidatePath("/dashboard/kalendarz")
}

function assertRange(startMin: number, endMin: number) {
  if (!Number.isInteger(startMin) || !Number.isInteger(endMin)) {
    throw new Error("Godziny muszą być pełnymi minutami.")
  }
  if (startMin < 0 || endMin > DAY_MINUTES) {
    throw new Error("Godziny muszą mieścić się w dobie.")
  }
  if (endMin <= startMin) {
    throw new Error("Godzina zakończenia musi być późniejsza niż rozpoczęcia.")
  }
}

/** Lokalizacja musi należeć do tego samego nauczyciela, co reguła. */
async function assertLocationBelongsToTeacher(
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

export async function addAvailabilityRule(input: {
  teacherProfileId: string
  weekday: number
  startMin: number
  endMin: number
  locationId: string | null
}) {
  await requireTeacherAccess(input.teacherProfileId)
  assertRange(input.startMin, input.endMin)
  if (input.weekday < 1 || input.weekday > 7) {
    throw new Error("Nieprawidłowy dzień tygodnia.")
  }
  await assertLocationBelongsToTeacher(input.teacherProfileId, input.locationId)

  const duplicate = await prisma.availabilityRule.findFirst({
    where: {
      teacherProfileId: input.teacherProfileId,
      weekday: input.weekday,
      startMin: input.startMin,
      endMin: input.endMin,
      locationId: input.locationId,
    },
    select: { id: true },
  })
  if (duplicate) throw new Error("Taka reguła już istnieje.")

  await prisma.availabilityRule.create({
    data: {
      teacherProfileId: input.teacherProfileId,
      weekday: input.weekday,
      startMin: input.startMin,
      endMin: input.endMin,
      locationId: input.locationId,
    },
  })
  refresh()
}

export async function toggleAvailabilityRule(id: string) {
  const rule = await prisma.availabilityRule.findUnique({
    where: { id },
    select: { teacherProfileId: true, isActive: true },
  })
  if (!rule) throw new Error("Nie znaleziono reguły.")
  await requireTeacherAccess(rule.teacherProfileId)

  await prisma.availabilityRule.update({
    where: { id },
    data: { isActive: !rule.isActive },
  })
  refresh()
}

export async function deleteAvailabilityRule(id: string) {
  const rule = await prisma.availabilityRule.findUnique({
    where: { id },
    select: { teacherProfileId: true },
  })
  if (!rule) throw new Error("Nie znaleziono reguły.")
  await requireTeacherAccess(rule.teacherProfileId)

  await prisma.availabilityRule.delete({ where: { id } })
  refresh()
}

export async function addAvailabilityException(input: {
  teacherProfileId: string
  /** Data w formacie "RRRR-MM-DD" z pola typu date. */
  date: string
  type: ExceptionType
  startMin: number | null
  endMin: number | null
  locationId: string | null
  reason: string | null
}) {
  await requireTeacherAccess(input.teacherProfileId)

  const [year, month, day] = input.date.split("-").map(Number)
  if (!year || !month || !day) throw new Error("Nieprawidłowa data.")

  const hasHours = input.startMin !== null && input.endMin !== null
  if (hasHours) {
    assertRange(input.startMin!, input.endMin!)
  } else if (input.type === "EXTRA") {
    throw new Error("Dodatkowe okienko wymaga podania godzin.")
  }

  await assertLocationBelongsToTeacher(input.teacherProfileId, input.locationId)

  await prisma.availabilityException.create({
    data: {
      teacherProfileId: input.teacherProfileId,
      date: toDateOnly(new Date(year, month - 1, day)),
      type: input.type,
      startMin: hasHours ? input.startMin : null,
      endMin: hasHours ? input.endMin : null,
      locationId: input.locationId,
      reason: input.reason?.trim() || null,
    },
  })
  refresh()
}

export async function deleteAvailabilityException(id: string) {
  const exception = await prisma.availabilityException.findUnique({
    where: { id },
    select: { teacherProfileId: true },
  })
  if (!exception) throw new Error("Nie znaleziono wyjątku.")
  await requireTeacherAccess(exception.teacherProfileId)

  await prisma.availabilityException.delete({ where: { id } })
  refresh()
}

export async function updateLessonSettings(input: {
  teacherProfileId: string
  slotMinutes: number
  bufferMinutes: number
  minLeadHours: number
  maxAdvanceDays: number
}) {
  await requireTeacherAccess(input.teacherProfileId)

  if (input.slotMinutes < 15 || input.slotMinutes > 480) {
    throw new Error("Długość lekcji musi mieścić się między 15 a 480 minutami.")
  }
  if (input.bufferMinutes < 0 || input.bufferMinutes > 120) {
    throw new Error("Przerwa musi mieścić się między 0 a 120 minutami.")
  }
  if (input.minLeadHours < 0 || input.minLeadHours > 720) {
    throw new Error("Wyprzedzenie musi mieścić się między 0 a 720 godzinami.")
  }
  if (input.maxAdvanceDays < 1 || input.maxAdvanceDays > 365) {
    throw new Error(
      "Horyzont rezerwacji musi mieścić się między 1 a 365 dniami."
    )
  }

  await prisma.teacherProfile.update({
    where: { id: input.teacherProfileId },
    data: {
      slotMinutes: input.slotMinutes,
      bufferMinutes: input.bufferMinutes,
      minLeadHours: input.minLeadHours,
      maxAdvanceDays: input.maxAdvanceDays,
    },
  })
  refresh()
}
