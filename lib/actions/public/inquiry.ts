"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  clientIp,
  honeypotFilled,
  recentInquiryCount,
  stampLooksHuman,
  tooManyFromAddress,
} from "@/lib/actions/public/guard"
import { notify } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"
import * as v from "@/lib/validation"

/**
 * Zapytanie z formularza kontaktowego.
 *
 * Zapytanie to nie rezerwacja: nie blokuje terminu i nie wymaga wolnej
 * godziny. Ktoś pyta, czy w ogóle da się pomóc — i musi dostać odpowiedź
 * od człowieka, dlatego trafia do `/dashboard/zapytania`, a nie do kalendarza.
 */

const schema = z.object({
  name: v.personName,
  email: v.email,
  phone: v.optionalPhone,
  subjectSlug: v.optionalSlug,
  levelSlug: v.optionalSlug,
  teacherSlug: v.optionalSlug,
  message: v.message,
  preferredTerm: z
    .string()
    .trim()
    .max(120, "Ten opis może mieć najwyżej 120 znaków.")
    .transform((value) => value || null),
  consent: v.consent,
  hp: z.string().optional(),
  stamp: z.string().optional(),
})

export type SubmitInquiryInput = z.input<typeof schema>

export type SubmitInquiryResult =
  | { ok: true }
  | { ok: false; errors: v.FieldErrors; message?: string }

export async function submitInquiry(
  input: SubmitInquiryInput
): Promise<SubmitInquiryResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: v.fieldErrors(parsed.error) }
  }
  const data = parsed.data

  if (honeypotFilled(data.hp) || !stampLooksHuman(data.stamp)) {
    return { ok: true }
  }

  const ip = await clientIp()
  if (tooManyFromAddress(ip, "inquiry", { limit: 6 })) {
    return v.failWith(
      "Za dużo wiadomości z tego miejsca w krótkim czasie. Spróbuj za godzinę."
    )
  }

  if ((await recentInquiryCount(data.email)) >= 3) {
    return v.failWith(
      "Mamy już Twoją wiadomość — odpowiemy na nią, zanim wyślesz kolejną."
    )
  }

  const [subject, level, teacher] = await Promise.all([
    data.subjectSlug
      ? prisma.subject.findFirst({
          where: { slug: data.subjectSlug, isActive: true },
          select: { id: true, name: true },
        })
      : null,
    data.levelSlug
      ? prisma.level.findFirst({
          where: { slug: data.levelSlug, isActive: true },
          select: { id: true, name: true },
        })
      : null,
    data.teacherSlug
      ? prisma.teacherProfile.findFirst({
          where: { slug: data.teacherSlug, isPublished: true },
          select: { id: true, userId: true },
        })
      : null,
  ])

  await prisma.inquiry.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      subjectId: subject?.id ?? null,
      levelId: level?.id ?? null,
      teacherProfileId: teacher?.id ?? null,
      message: data.message,
      preferredTerm: data.preferredTerm,
    },
  })

  // Zapytanie skierowane do konkretnej osoby idzie do niej; reszta do adminów,
  // żeby nie utknęła u nauczyciela, który akurat nie zagląda do panelu.
  await notify({
    type: "INQUIRY_CREATED",
    title: "Nowe zapytanie ze strony",
    message: `${data.name}${subject ? ` · ${subject.name}` : ""}${level ? ` · ${level.name}` : ""}`,
    link: "/dashboard/zapytania",
    ...(teacher ? { userId: teacher.userId } : { targetRole: "ADMIN" as const }),
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/zapytania")

  return { ok: true }
}
