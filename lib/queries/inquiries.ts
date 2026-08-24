import type { DashboardContext } from "@/lib/auth"
import type { InquiryStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/**
 * Nauczyciel widzi zapytania skierowane do niego. Te bez przypisania są
 * na razie sprawą administratora — dopiero on decyduje, kto je przejmie.
 */
function inquiryScope(ctx: DashboardContext) {
  if (ctx.isAdmin) return {}
  return { teacherProfileId: ctx.teacherProfileId ?? "__brak__" }
}

export async function getInquiries(
  ctx: DashboardContext,
  status?: InquiryStatus
) {
  return prisma.inquiry.findMany({
    where: { ...inquiryScope(ctx), ...(status ? { status } : {}) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      preferredTerm: true,
      status: true,
      handledAt: true,
      createdAt: true,
      teacherProfileId: true,
      subject: { select: { name: true } },
      level: { select: { name: true } },
      teacherProfile: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })
}

export async function getInquiryCounts(ctx: DashboardContext) {
  const rows = await prisma.inquiry.groupBy({
    by: ["status"],
    where: inquiryScope(ctx),
    _count: { _all: true },
  })
  return Object.fromEntries(
    rows.map((row) => [row.status, row._count._all])
  ) as Partial<Record<InquiryStatus, number>>
}
