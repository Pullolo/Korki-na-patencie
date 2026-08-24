"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin, requireTeacherAccess } from "@/lib/auth"
import type { LocationType } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { uniqueSlug } from "@/lib/slug"

function refreshCatalog() {
  revalidatePath("/dashboard/przedmioty")
  revalidatePath("/dashboard/poziomy")
  revalidatePath("/dashboard/nauczyciele")
}

function requireName(name: string) {
  const trimmed = name.trim()
  if (trimmed.length < 2)
    throw new Error("Nazwa musi mieć co najmniej 2 znaki.")
  return trimmed
}

// ─── Przedmioty ───────────────────────────────────────────────────────────────

export type SubjectInput = {
  name: string
  description: string | null
  color: string | null
  isActive: boolean
  order: number
}

export async function createSubject(input: SubjectInput) {
  await requireAdmin()
  const name = requireName(input.name)

  await prisma.subject.create({
    data: {
      name,
      slug: await uniqueSlug(name, async (slug) => {
        const found = await prisma.subject.findUnique({
          where: { slug },
          select: { id: true },
        })
        return found?.id ?? null
      }),
      description: input.description?.trim() || null,
      color: input.color || null,
      isActive: input.isActive,
      order: input.order,
    },
  })
  refreshCatalog()
}

export async function updateSubject(id: string, input: SubjectInput) {
  await requireAdmin()
  const name = requireName(input.name)

  await prisma.subject.update({
    where: { id },
    data: {
      name,
      description: input.description?.trim() || null,
      color: input.color || null,
      isActive: input.isActive,
      order: input.order,
    },
  })
  refreshCatalog()
}

export async function deleteSubject(id: string) {
  await requireAdmin()

  const usage = await prisma.subject.findUnique({
    where: { id },
    select: { _count: { select: { bookings: true, teacherSubjects: true } } },
  })
  if (!usage) throw new Error("Nie znaleziono przedmiotu.")

  // Kasowanie przedmiotu z historią zabrałoby kontekst starym rezerwacjom.
  if (usage._count.bookings > 0) {
    throw new Error(
      "Ten przedmiot ma powiązane rezerwacje — zamiast kasować, ustaw go jako ukryty."
    )
  }
  if (usage._count.teacherSubjects > 0) {
    throw new Error(
      "Najpierw odepnij przedmiot od nauczycieli, którzy go uczą."
    )
  }

  await prisma.subject.delete({ where: { id } })
  refreshCatalog()
}

// ─── Poziomy ──────────────────────────────────────────────────────────────────

export type LevelInput = {
  name: string
  isActive: boolean
  order: number
}

export async function createLevel(input: LevelInput) {
  await requireAdmin()
  const name = requireName(input.name)

  await prisma.level.create({
    data: {
      name,
      slug: await uniqueSlug(name, async (slug) => {
        const found = await prisma.level.findUnique({
          where: { slug },
          select: { id: true },
        })
        return found?.id ?? null
      }),
      isActive: input.isActive,
      order: input.order,
    },
  })
  refreshCatalog()
}

export async function updateLevel(id: string, input: LevelInput) {
  await requireAdmin()
  await prisma.level.update({
    where: { id },
    data: {
      name: requireName(input.name),
      isActive: input.isActive,
      order: input.order,
    },
  })
  refreshCatalog()
}

export async function deleteLevel(id: string) {
  await requireAdmin()

  const usage = await prisma.level.findUnique({
    where: { id },
    select: { _count: { select: { bookings: true } } },
  })
  if (!usage) throw new Error("Nie znaleziono poziomu.")
  if (usage._count.bookings > 0) {
    throw new Error(
      "Ten poziom ma powiązane rezerwacje — zamiast kasować, ustaw go jako ukryty."
    )
  }

  await prisma.level.delete({ where: { id } })
  refreshCatalog()
}

// ─── Lokalizacje ──────────────────────────────────────────────────────────────

export type LocationInput = {
  name: string
  type: LocationType
  address: string | null
  city: string | null
  note: string | null
  isActive: boolean
  order: number
}

function refreshLocations() {
  revalidatePath("/dashboard/lokalizacje")
  revalidatePath("/dashboard/dostepnosc")
  revalidatePath("/dashboard/nauczyciele")
}

export async function createLocation(
  teacherProfileId: string,
  input: LocationInput
) {
  await requireTeacherAccess(teacherProfileId)

  await prisma.location.create({
    data: {
      teacherProfileId,
      name: requireName(input.name),
      type: input.type,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      note: input.note?.trim() || null,
      isActive: input.isActive,
      order: input.order,
    },
  })
  refreshLocations()
}

export async function updateLocation(id: string, input: LocationInput) {
  const location = await prisma.location.findUnique({
    where: { id },
    select: { teacherProfileId: true },
  })
  if (!location) throw new Error("Nie znaleziono lokalizacji.")
  await requireTeacherAccess(location.teacherProfileId)

  await prisma.location.update({
    where: { id },
    data: {
      name: requireName(input.name),
      type: input.type,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      note: input.note?.trim() || null,
      isActive: input.isActive,
      order: input.order,
    },
  })
  refreshLocations()
}

export async function deleteLocation(id: string) {
  const location = await prisma.location.findUnique({
    where: { id },
    select: {
      teacherProfileId: true,
      _count: { select: { bookings: true, availabilityRules: true } },
    },
  })
  if (!location) throw new Error("Nie znaleziono lokalizacji.")
  await requireTeacherAccess(location.teacherProfileId)

  if (location._count.bookings > 0) {
    throw new Error(
      "Ta lokalizacja ma powiązane rezerwacje — zamiast kasować, ustaw ją jako ukrytą."
    )
  }

  // Reguły grafiku zostaną bez lokalizacji (onDelete: SetNull), więc uprzedzamy.
  if (location._count.availabilityRules > 0) {
    throw new Error(
      `Najpierw zmień lokalizację w ${location._count.availabilityRules} regułach grafiku, które z niej korzystają.`
    )
  }

  await prisma.location.delete({ where: { id } })
  refreshLocations()
}
