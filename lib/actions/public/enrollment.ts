"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  clientIp,
  honeypotFilled,
  recentEnrollmentCount,
  stampLooksHuman,
  tooManyFromAddress,
} from "@/lib/actions/public/guard"
import { EnrollmentError, enrollStudent } from "@/lib/enrollment"
import { notify } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import { revalidateTags, TAGS } from "@/lib/tags"
import * as v from "@/lib/validation"

/**
 * Zapis do grupy z formularza na stronie.
 *
 * Reguły zapisu (rabat, limit miejsc, lista rezerwowa) są wspólne z panelem —
 * mieszkają w `lib/enrollment.ts`. Tutaj zostaje to, co dotyczy nieznajomego:
 * walidacja, anty-spam i sprawdzenie, czy grupa jest w ogóle opublikowana.
 */

const schema = z.object({
  groupSlug: v.slug,
  name: v.personName,
  email: v.email,
  phone: v.phone,
  note: z
    .string()
    .trim()
    .max(500, "Notatka może mieć najwyżej 500 znaków.")
    .transform((value) => value || null),
  consent: v.consent,
  hp: z.string().optional(),
  stamp: z.string().optional(),
})

export type EnrollPublicInput = z.input<typeof schema>

export type EnrollPublicResult =
  | { ok: true; kod: string; waitlisted: boolean; discountPercent: number }
  | { ok: false; errors: v.FieldErrors; message?: string }

export async function enrollPublic(
  input: EnrollPublicInput
): Promise<EnrollPublicResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: v.fieldErrors(parsed.error) }
  }
  const data = parsed.data

  if (honeypotFilled(data.hp) || !stampLooksHuman(data.stamp)) {
    return { ok: true, kod: "GRP-0000", waitlisted: false, discountPercent: 0 }
  }

  const ip = await clientIp()
  if (tooManyFromAddress(ip, "enrollment", { limit: 6 })) {
    return v.failWith(
      "Za dużo zgłoszeń z tego miejsca w krótkim czasie. Spróbuj za godzinę albo zadzwoń."
    )
  }

  if ((await recentEnrollmentCount(data.email, data.phone)) >= 3) {
    return v.failWith(
      "Z tego kontaktu poszło już kilka zapisów. Odezwiemy się, zanim wyślesz kolejny."
    )
  }

  const group = await prisma.courseGroup.findFirst({
    where: { slug: data.groupSlug, isPublished: true, isActive: true },
    select: {
      id: true,
      name: true,
      teacherProfile: { select: { userId: true } },
    },
  })
  if (!group) {
    return v.failWith("Do tej grupy nie da się teraz zapisać.")
  }

  // Zalogowany uczeń dostaje zapis przypięty do konta — i tylko wtedy może
  // złapać rabat, bo rabat wynika z jego historii lekcji.
  const clerkUser = await currentUser()
  const account = clerkUser
    ? await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
        select: { id: true },
      })
    : null

  try {
    const result = await enrollStudent(
      group.id,
      {
        studentId: account?.id ?? null,
        guestName: account ? null : data.name,
        guestEmail: account ? null : data.email,
        guestPhone: data.phone,
        note: data.note,
      },
      { requirePublished: true }
    )

    await notify({
      type: "SYSTEM",
      title: result.waitlisted
        ? "Nowy zapis na listę rezerwową"
        : "Nowy zapis do grupy",
      message: `${data.name} · ${group.name}`,
      link: "/dashboard/grupy",
      userId: group.teacherProfile.userId,
    })

    revalidatePath("/dashboard/grupy")
    revalidateTags(TAGS.grupy)

    return {
      ok: true,
      kod: result.reference,
      waitlisted: result.waitlisted,
      discountPercent: result.discountPercent,
    }
  } catch (error) {
    if (error instanceof EnrollmentError) {
      return v.failWith(error.message)
    }
    throw error
  }
}
