"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type PriceRuleInput = {
  levelId: string | null
  subjectId: string | null
  teacherProfileId: string | null
  pricePerHour: number
  note: string | null
  isActive: boolean
}

function refresh() {
  revalidatePath("/dashboard/cennik")
  revalidatePath("/dashboard/nauczyciele")
}

function assertPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0 || value > 10_000) {
    throw new Error("Stawka musi mieścić się między 1 a 10 000.")
  }
}

/**
 * Dwie reguły o tym samym zestawie pól dawałyby niedeterministyczny wynik,
 * bo mają identyczną szczegółowość — dlatego takiego duplikatu nie wpuszczamy.
 */
async function assertNoDuplicate(input: PriceRuleInput, currentId?: string) {
  const duplicate = await prisma.priceRule.findFirst({
    where: {
      levelId: input.levelId,
      subjectId: input.subjectId,
      teacherProfileId: input.teacherProfileId,
      ...(currentId ? { NOT: { id: currentId } } : {}),
    },
    select: { id: true },
  })
  if (duplicate) {
    throw new Error(
      "Reguła o takim zakresie już istnieje — zamiast dodawać drugą, zmień tamtą."
    )
  }
}

export async function createPriceRule(input: PriceRuleInput) {
  await requireAdmin()
  assertPrice(input.pricePerHour)
  await assertNoDuplicate(input)

  await prisma.priceRule.create({
    data: {
      levelId: input.levelId,
      subjectId: input.subjectId,
      teacherProfileId: input.teacherProfileId,
      pricePerHour: input.pricePerHour,
      note: input.note?.trim() || null,
      isActive: input.isActive,
    },
  })
  refresh()
}

export async function updatePriceRule(id: string, input: PriceRuleInput) {
  await requireAdmin()
  assertPrice(input.pricePerHour)
  await assertNoDuplicate(input, id)

  await prisma.priceRule.update({
    where: { id },
    data: {
      levelId: input.levelId,
      subjectId: input.subjectId,
      teacherProfileId: input.teacherProfileId,
      pricePerHour: input.pricePerHour,
      note: input.note?.trim() || null,
      isActive: input.isActive,
    },
  })
  refresh()
}

export async function deletePriceRule(id: string) {
  await requireAdmin()
  await prisma.priceRule.delete({ where: { id } })
  refresh()
}
