import { startOfMonth, subMonths } from "date-fns"

import { teacherScope, type DashboardContext } from "@/lib/auth"
import { monthKey, monthLabel } from "@/lib/dates"
import type { BookingStatus, LocationType } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { getAvailabilityPreview } from "@/lib/queries/availability"

const COUNTED: BookingStatus[] = ["CONFIRMED", "COMPLETED"]
const OCCUPANCY_DAYS = 28

export type Statistics = Awaited<ReturnType<typeof getStatistics>>

export async function getStatistics(ctx: DashboardContext) {
  const scope = teacherScope(ctx)
  const now = new Date()
  const chartStart = startOfMonth(subMonths(now, 5))

  const [rows, statusRows, teacherRows, groupEnrollments] = await Promise.all([
    prisma.booking.findMany({
      where: {
        ...scope,
        status: { in: COUNTED },
        startsAt: { gte: chartStart },
      },
      select: {
        startsAt: true,
        price: true,
        mode: true,
        subject: { select: { name: true, color: true } },
        level: { select: { name: true } },
        teacherProfile: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: scope,
      _count: { _all: true },
    }),
    ctx.isAdmin
      ? prisma.teacherProfile.findMany({
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        })
      : Promise.resolve([]),
    // Abonamenty grupowe to przychód powtarzalny — liczymy je osobno od lekcji.
    prisma.groupEnrollment.findMany({
      where: {
        status: "ACTIVE",
        group: ctx.isAdmin
          ? {}
          : { teacherProfileId: ctx.teacherProfileId ?? "__brak__" },
      },
      select: {
        monthlyPrice: true,
        discountPercent: true,
        group: { select: { name: true } },
      },
    }),
  ])

  // ─── Szeregi czasowe ────────────────────────────────────────────────────────
  const months = new Map<string, { lessons: number; revenue: number }>()
  for (let i = 5; i >= 0; i--) {
    months.set(monthKey(startOfMonth(subMonths(now, i))), {
      lessons: 0,
      revenue: 0,
    })
  }
  for (const row of rows) {
    const bucket = months.get(monthKey(row.startsAt))
    if (!bucket) continue
    bucket.lessons += 1
    bucket.revenue += row.price ?? 0
  }

  const byMonth = [...months.entries()].map(([key, value]) => ({
    label: monthLabel(key),
    lessons: value.lessons,
    revenue: value.revenue,
  }))

  // ─── Rozkłady ───────────────────────────────────────────────────────────────
  function tally<T extends string>(
    pick: (row: (typeof rows)[number]) => T | null
  ) {
    const counts = new Map<T, { count: number; revenue: number }>()
    for (const row of rows) {
      const key = pick(row)
      if (key === null) continue
      const bucket = counts.get(key) ?? { count: 0, revenue: 0 }
      bucket.count += 1
      bucket.revenue += row.price ?? 0
      counts.set(key, bucket)
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, ...value }))
      .sort((a, b) => b.count - a.count)
  }

  const subjectColors = new Map<string, string>()
  for (const row of rows) {
    if (row.subject?.name && row.subject.color) {
      subjectColors.set(row.subject.name, row.subject.color)
    }
  }

  const bySubject = tally((row) => row.subject?.name ?? null).map((item) => ({
    ...item,
    color: subjectColors.get(item.label),
  }))
  const byLevel = tally((row) => row.level?.name ?? null)
  const byMode = tally((row) => row.mode as LocationType)
  const byTeacher = tally(
    (row) =>
      [row.teacherProfile.user.firstName, row.teacherProfile.user.lastName]
        .filter(Boolean)
        .join(" ") || "—"
  )

  const byStatus = Object.fromEntries(
    statusRows.map((row) => [row.status, row._count._all])
  ) as Partial<Record<BookingStatus, number>>

  // ─── Obłożenie najbliższych 4 tygodni ──────────────────────────────────────
  // Patrzymy w przód, bo tylko tam mamy sensowne porównanie: ile okienek
  // wystawiono i ile z nich zostało już zajętych.
  const teacherIds = ctx.isAdmin
    ? teacherRows.map((teacher) => teacher.id)
    : ctx.teacherProfileId
      ? [ctx.teacherProfileId]
      : []

  const horizon = new Date(now.getTime() + OCCUPANCY_DAYS * 86_400_000)
  const [freeSlotCounts, upcomingBooked] = await Promise.all([
    Promise.all(
      teacherIds.map(async (id) => {
        const days = await getAvailabilityPreview(id, OCCUPANCY_DAYS).catch(
          () => []
        )
        return days.reduce((sum, day) => sum + day.slots.length, 0)
      })
    ),
    prisma.booking.count({
      where: {
        ...scope,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { gte: now, lt: horizon },
      },
    }),
  ])

  const freeSlots = freeSlotCounts.reduce((sum, count) => sum + count, 0)
  const capacity = freeSlots + upcomingBooked
  const occupancy =
    capacity === 0 ? 0 : Math.round((upcomingBooked / capacity) * 100)

  const groupRevenue = groupEnrollments.reduce(
    (sum, item) => sum + item.monthlyPrice,
    0
  )
  const discounted = groupEnrollments.filter(
    (item) => item.discountPercent > 0
  ).length

  const byGroup = Object.entries(
    groupEnrollments.reduce<Record<string, { count: number; revenue: number }>>(
      (acc, item) => {
        const bucket = acc[item.group.name] ?? { count: 0, revenue: 0 }
        bucket.count += 1
        bucket.revenue += item.monthlyPrice
        acc[item.group.name] = bucket
        return acc
      },
      {}
    )
  )
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.count - a.count)

  return {
    byMonth,
    byGroup,
    groups: {
      revenuePerMonth: groupRevenue,
      students: groupEnrollments.length,
      discounted,
    },
    bySubject,
    byLevel,
    byMode,
    byTeacher: ctx.isAdmin ? byTeacher : [],
    byStatus,
    occupancy: {
      percent: occupancy,
      booked: upcomingBooked,
      free: freeSlots,
      days: OCCUPANCY_DAYS,
    },
    totals: {
      lessons: rows.length,
      revenue: rows.reduce((sum, row) => sum + (row.price ?? 0), 0),
    },
  }
}
