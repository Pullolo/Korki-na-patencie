import type { DashboardContext } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** Widzę swoje imienne powiadomienia oraz te skierowane do mojej roli. */
function recipientFilter(ctx: DashboardContext) {
  return {
    OR: [{ userId: ctx.userId }, { targetRole: ctx.role }],
  }
}

export async function getNotifications(ctx: DashboardContext) {
  return prisma.notification.findMany({
    where: recipientFilter(ctx),
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      link: true,
      read: true,
      createdAt: true,
    },
  })
}

export async function getUnreadCount(ctx: DashboardContext) {
  return prisma.notification.count({
    where: { ...recipientFilter(ctx), read: false },
  })
}
