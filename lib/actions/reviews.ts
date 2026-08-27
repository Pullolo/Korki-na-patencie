"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth"
import type { ReviewStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { revalidateTags, TAGS } from "@/lib/tags"

/**
 * Moderacja opinii. Publikuje wyłącznie admin — opinia wystawiona przez
 * ucznia czeka w stanie PENDING, dopóki ktoś jej nie przeczyta.
 */

function refresh() {
  revalidatePath("/dashboard/opinie")
  revalidatePath("/dashboard")
  // Front trzyma zatwierdzone opinie w cache'u pod tagiem `opinie`.
  revalidateTags(TAGS.opinie)
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  await requireAdmin()

  await prisma.review.update({
    where: { id },
    data: {
      status,
      // Data publikacji jest znacznikiem dla strony — porządkujemy nią listę.
      publishedAt: status === "APPROVED" ? new Date() : null,
    },
  })
  refresh()
}

export async function deleteReview(id: string) {
  await requireAdmin()
  await prisma.review.delete({ where: { id } })
  refresh()
}

/** Ręczny wpis opinii, np. przepisanej z wiadomości od rodzica. */
export type ReviewInput = {
  authorName: string
  teacherProfileId: string | null
  subjectId: string | null
  rating: number
  content: string
  status: ReviewStatus
}

export async function createReview(input: ReviewInput) {
  await requireAdmin()

  if (input.authorName.trim().length < 2) {
    throw new Error("Podaj, kto wystawił opinię.")
  }
  if (input.content.trim().length < 10) {
    throw new Error("Treść opinii musi mieć co najmniej 10 znaków.")
  }
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Ocena musi mieścić się między 1 a 5.")
  }

  await prisma.review.create({
    data: {
      authorName: input.authorName.trim(),
      teacherProfileId: input.teacherProfileId,
      subjectId: input.subjectId,
      rating: input.rating,
      content: input.content.trim(),
      status: input.status,
      publishedAt: input.status === "APPROVED" ? new Date() : null,
    },
  })
  refresh()
}
