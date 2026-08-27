"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { notify } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import * as v from "@/lib/validation"

/**
 * Opinia wystawiona przez ucznia po odbytej lekcji.
 *
 * Jedyna akcja publiczna, która wymaga konta — i to nie z powodu wygody,
 * tylko dlatego, że opinia musi być powiązana z konkretną, odbytą lekcją
 * tej osoby. Bez tego mielibyśmy formularz na anonimowe pochwały,
 * a `PRODUCT.md` zabrania podpierania się dowodami, których nie ma.
 *
 * Opinia gościa (bez konta) zostaje odłożona do etapu 4 — sensowna dopiero
 * z linkiem wysłanym mailem po lekcji.
 */

const schema = z.object({
  bookingId: v.cuid,
  rating: z
    .number()
    .int()
    .min(1, "Wybierz ocenę od 1 do 5.")
    .max(5, "Wybierz ocenę od 1 do 5."),
  content: z
    .string()
    .trim()
    .min(20, "Napisz choć dwa zdania — jedno słowo nikomu nie pomoże.")
    .max(2000, "Opinia może mieć najwyżej 2000 znaków."),
  authorName: v.personName,
  consent: v.consent,
})

export type SubmitReviewInput = z.input<typeof schema>

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; errors: v.FieldErrors; message?: string }

export async function submitReview(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: v.fieldErrors(parsed.error) }
  }
  const data = parsed.data

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return v.failWith("Zaloguj się, żeby wystawić opinię.")
  }

  const account = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  })
  if (!account) {
    return v.failWith("Nie znaleźliśmy Twojego konta.")
  }

  // Opinia wisi na konkretnej lekcji: musi być Twoja i musi się odbyć.
  const booking = await prisma.booking.findFirst({
    where: { id: data.bookingId, studentId: account.id },
    select: {
      id: true,
      status: true,
      teacherProfileId: true,
      subjectId: true,
      review: { select: { id: true } },
      teacherProfile: { select: { userId: true } },
    },
  })
  if (!booking) {
    return v.failWith("Nie znaleźliśmy tej lekcji na Twoim koncie.")
  }
  if (booking.status !== "COMPLETED") {
    return v.failWith("Opinię można wystawić po odbytej lekcji.")
  }
  if (booking.review) {
    return v.failWith("Do tej lekcji jest już opinia.")
  }

  await prisma.review.create({
    data: {
      authorName: data.authorName,
      authorId: account.id,
      teacherProfileId: booking.teacherProfileId,
      subjectId: booking.subjectId,
      bookingId: booking.id,
      rating: data.rating,
      content: data.content,
      // Opinia czeka na moderację — publikuje ją admin w panelu.
      status: "PENDING",
    },
  })

  await notify({
    type: "REVIEW_CREATED",
    title: "Nowa opinia do moderacji",
    message: `${data.authorName} · ocena ${data.rating}/5`,
    link: "/dashboard/opinie",
    targetRole: "ADMIN",
  })

  revalidatePath("/dashboard/opinie")
  revalidatePath("/konto/lekcje")

  return { ok: true }
}
