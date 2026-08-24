"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin, requireDashboardUser } from "@/lib/auth"
import type { InquiryStatus } from "@/lib/generated/prisma/enums"
import { notify } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"

function refresh() {
  revalidatePath("/dashboard/zapytania")
  revalidatePath("/dashboard")
}

/** Nauczyciel rusza tylko zapytania skierowane do niego, admin wszystkie. */
async function loadInquiryForUpdate(id: string) {
  const ctx = await requireDashboardUser()
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: { id: true, teacherProfileId: true },
  })
  if (!inquiry) throw new Error("Nie znaleziono zapytania.")

  if (!ctx.isAdmin && inquiry.teacherProfileId !== ctx.teacherProfileId) {
    throw new Error("To zapytanie nie jest skierowane do Ciebie.")
  }
  return inquiry
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const inquiry = await loadInquiryForUpdate(id)

  await prisma.inquiry.update({
    where: { id: inquiry.id },
    data: {
      status,
      handledAt: status === "NEW" ? null : new Date(),
    },
  })
  refresh()
}

export async function assignInquiry(
  id: string,
  teacherProfileId: string | null
) {
  await requireAdmin()

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: { teacherProfileId },
    select: { name: true, subject: { select: { name: true } } },
  })

  if (teacherProfileId) {
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      select: { userId: true },
    })
    if (teacher) {
      await notify({
        type: "INQUIRY_CREATED",
        title: "Przypisano Ci zapytanie",
        message: `${inquiry.name}${inquiry.subject ? ` — ${inquiry.subject.name}` : ""}`,
        link: "/dashboard/zapytania",
        userId: teacher.userId,
      })
    }
  }
  refresh()
}

export async function deleteInquiry(id: string) {
  await requireAdmin()
  await prisma.inquiry.delete({ where: { id } })
  refresh()
}
