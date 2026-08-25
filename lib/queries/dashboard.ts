import { startOfMonth, subMonths } from "date-fns"

import { teacherScope, type DashboardContext } from "@/lib/auth"
import { monthKey, monthLabel } from "@/lib/dates"
import type { BookingStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

/** Lekcje, które faktycznie się odbyły albo odbędą — te liczymy w statystykach. */
const COUNTED: BookingStatus[] = ["CONFIRMED", "COMPLETED"]

function growth(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / previous) * 100)
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>

export async function getDashboardStats(ctx: DashboardContext) {
  const scope = teacherScope(ctx)
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const prevMonthStart = startOfMonth(subMonths(now, 1))
  const chartStart = startOfMonth(subMonths(now, 5))

  const [
    lessonsThisMonth,
    lessonsPrevMonth,
    pendingBookings,
    revenueThisMonth,
    revenuePrevMonth,
    studentGroups,
    chartBookings,
    upcoming,
    latestPending,
    groupRevenue,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        ...scope,
        status: { in: COUNTED },
        startsAt: { gte: thisMonthStart },
      },
    }),
    prisma.booking.count({
      where: {
        ...scope,
        status: { in: COUNTED },
        startsAt: { gte: prevMonthStart, lt: thisMonthStart },
      },
    }),
    prisma.booking.count({ where: { ...scope, status: "PENDING" } }),
    prisma.booking.aggregate({
      _sum: { price: true },
      where: {
        ...scope,
        status: { in: COUNTED },
        startsAt: { gte: thisMonthStart },
      },
    }),
    prisma.booking.aggregate({
      _sum: { price: true },
      where: {
        ...scope,
        status: { in: COUNTED },
        startsAt: { gte: prevMonthStart, lt: thisMonthStart },
      },
    }),
    // Grupowanie po stronie bazy; uczeń-gość nie ma studentId, więc rozróżniamy go po e-mailu.
    prisma.booking.groupBy({
      by: ["studentId", "guestEmail"],
      where: { ...scope, status: { in: COUNTED } },
    }),
    prisma.booking.findMany({
      where: {
        ...scope,
        status: { in: COUNTED },
        startsAt: { gte: chartStart },
      },
      select: { startsAt: true },
    }),
    prisma.booking.findMany({
      where: { ...scope, status: "CONFIRMED", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        mode: true,
        guestName: true,
        student: { select: { firstName: true, lastName: true, email: true } },
        subject: { select: { name: true } },
        teacherProfile: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.booking.findMany({
      where: { ...scope, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        reference: true,
        createdAt: true,
        startsAt: true,
        guestName: true,
        student: { select: { firstName: true, lastName: true, email: true } },
        subject: { select: { name: true } },
      },
    }),
    prisma.groupEnrollment.aggregate({
      _sum: { monthlyPrice: true },
      where: {
        status: "ACTIVE",
        group: ctx.isAdmin
          ? {}
          : { teacherProfileId: ctx.teacherProfileId ?? "__brak__" },
      },
    }),
  ])

  const uniqueStudents = new Set(
    studentGroups.map((row) => row.studentId ?? row.guestEmail ?? "")
  )
  uniqueStudents.delete("")

  const monthly = new Map<string, number>()
  for (let i = 5; i >= 0; i--) {
    monthly.set(monthKey(startOfMonth(subMonths(now, i))), 0)
  }
  for (const booking of chartBookings) {
    const key = monthKey(booking.startsAt)
    if (monthly.has(key)) monthly.set(key, (monthly.get(key) ?? 0) + 1)
  }

  const chart = [...monthly.entries()].map(([key, value]) => ({
    label: monthLabel(key),
    value,
  }))

  return {
    lessonsThisMonth,
    lessonsGrowth: growth(lessonsThisMonth, lessonsPrevMonth),
    pendingBookings,
    revenueThisMonth: revenueThisMonth?._sum?.price ?? 0,
    revenueGrowth: growth(
      revenueThisMonth?._sum?.price ?? 0,
      revenuePrevMonth?._sum?.price ?? 0
    ),
    studentsCount: uniqueStudents.size,
    groupRevenuePerMonth: groupRevenue?._sum?.monthlyPrice ?? 0,
    chart,
    upcoming,
    latestPending,
  }
}

/** Liczniki na badge'ach w sidebarze. */
export async function getSidebarCounts(ctx: DashboardContext) {
  const scope = teacherScope(ctx)
  const [bookings, inquiries] = await Promise.all([
    prisma.booking.count({ where: { ...scope, status: "PENDING" } }),
    prisma.inquiry.count({
      where: {
        status: "NEW",
        ...(ctx.isAdmin ? {} : { teacherProfileId: ctx.teacherProfileId }),
      },
    }),
  ])
  return { bookings, inquiries }
}
