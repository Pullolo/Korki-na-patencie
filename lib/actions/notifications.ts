"use server"

import { revalidatePath } from "next/cache"

import { requireDashboardUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function refresh() {
  revalidatePath("/dashboard/powiadomienia")
  revalidatePath("/dashboard", "layout")
}

/** Oznacza jako przeczytane tylko to, co należy do wołającego. */
export async function markNotificationRead(id: string) {
  const ctx = await requireDashboardUser()

  await prisma.notification.updateMany({
    where: {
      id,
      OR: [{ userId: ctx.userId }, { targetRole: ctx.role }],
    },
    data: { read: true },
  })
  refresh()
}

export async function markAllNotificationsRead() {
  const ctx = await requireDashboardUser()

  await prisma.notification.updateMany({
    where: {
      read: false,
      OR: [{ userId: ctx.userId }, { targetRole: ctx.role }],
    },
    data: { read: true },
  })
  refresh()
}
