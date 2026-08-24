import { prisma } from "@/lib/prisma"

export type PriceRuleRow = Awaited<ReturnType<typeof getPriceRules>>[number]

export async function getPriceRules() {
  return prisma.priceRule.findMany({
    orderBy: [{ pricePerHour: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      levelId: true,
      subjectId: true,
      teacherProfileId: true,
      pricePerHour: true,
      note: true,
      isActive: true,
      level: { select: { name: true } },
      subject: { select: { name: true } },
      teacherProfile: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  })
}

/** Lekka wersja do wyliczania ceny — bez nazw, tylko to, czego potrzebuje resolver. */
export async function getActivePriceRules() {
  return prisma.priceRule.findMany({
    where: { isActive: true },
    select: {
      levelId: true,
      subjectId: true,
      teacherProfileId: true,
      pricePerHour: true,
    },
  })
}
