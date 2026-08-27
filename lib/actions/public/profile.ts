"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAccountUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as v from "@/lib/validation"

/**
 * Dane kontaktowe ucznia i jego profil.
 *
 * Uczeń zmienia wyłącznie własny wiersz — identyfikator bierzemy z sesji,
 * nigdy z formularza. Adresu e-mail nie ruszamy: należy do konta w Clerku
 * i zmiana idzie przez nie, nie przez nasz formularz.
 */

const schema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Imię musi mieć co najmniej 2 znaki.")
    .max(60, "Imię jest za długie."),
  lastName: z
    .string()
    .trim()
    .max(60, "Nazwisko jest za długie.")
    .transform((value) => value || null),
  phone: v.optionalPhone,
  levelId: v.optionalId,
  schoolName: z
    .string()
    .trim()
    .max(120, "Nazwa szkoły jest za długa.")
    .transform((value) => value || null),
  schoolClass: z
    .string()
    .trim()
    .max(30, "Klasa jest za długa.")
    .transform((value) => value || null),
  guardianName: z
    .string()
    .trim()
    .max(80, "Imię opiekuna jest za długie.")
    .transform((value) => value || null),
  guardianPhone: v.optionalPhone,
})

export type UpdateOwnProfileInput = z.input<typeof schema>

export type UpdateOwnProfileResult =
  | { ok: true }
  | { ok: false; errors: v.FieldErrors; message?: string }

export async function updateOwnProfile(
  input: UpdateOwnProfileInput
): Promise<UpdateOwnProfileResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: v.fieldErrors(parsed.error) }
  }
  const data = parsed.data

  let ctx
  try {
    ctx = await requireAccountUser()
  } catch {
    return v.failWith("Zaloguj się, żeby zapisać zmiany.")
  }

  if (data.levelId) {
    const level = await prisma.level.findFirst({
      where: { id: data.levelId, isActive: true },
      select: { id: true },
    })
    if (!level) return v.fail({ levelId: "Nie znamy takiego poziomu." })
  }

  await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
  })

  const profile = {
    levelId: data.levelId,
    schoolName: data.schoolName,
    schoolClass: data.schoolClass,
    guardianName: data.guardianName,
    guardianPhone: data.guardianPhone,
  }

  await prisma.studentProfile.upsert({
    where: { userId: ctx.userId },
    update: profile,
    create: { userId: ctx.userId, ...profile },
  })

  revalidatePath("/konto/dane")
  revalidatePath("/dashboard/uczniowie")

  return { ok: true }
}
