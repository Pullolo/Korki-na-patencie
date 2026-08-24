import { teacherScope, type DashboardContext } from "@/lib/auth"
import type { BookingStatus } from "@/lib/generated/prisma/enums"
import { prisma } from "@/lib/prisma"

export const BOOKING_SELECT = {
  id: true,
  reference: true,
  status: true,
  mode: true,
  startsAt: true,
  endsAt: true,
  price: true,
  studentNote: true,
  statusReason: true,
  createdAt: true,
  guestName: true,
  guestEmail: true,
  guestPhone: true,
  student: { select: { firstName: true, lastName: true, email: true } },
  subject: { select: { name: true } },
  level: { select: { name: true } },
  location: { select: { name: true } },
  teacherProfile: {
    select: { id: true, user: { select: { firstName: true, lastName: true } } },
  },
} as const

export type BookingRow = Awaited<ReturnType<typeof getBookings>>[number]

export async function getBookings(
  ctx: DashboardContext,
  options: { status?: BookingStatus; take?: number } = {}
) {
  return prisma.booking.findMany({
    where: {
      ...teacherScope(ctx),
      ...(options.status ? { status: options.status } : {}),
    },
    // Oczekujące najpierw — to one wymagają reakcji.
    orderBy: [{ status: "asc" }, { startsAt: "asc" }],
    take: options.take ?? 100,
    select: BOOKING_SELECT,
  })
}

export async function getBookingCountsByStatus(ctx: DashboardContext) {
  const rows = await prisma.booking.groupBy({
    by: ["status"],
    where: teacherScope(ctx),
    _count: { _all: true },
  })
  return Object.fromEntries(
    rows.map((row) => [row.status, row._count._all])
  ) as Partial<Record<BookingStatus, number>>
}

/** Pojedyncza rezerwacja z pełnym kontekstem; zwraca null, gdy poza zasięgiem roli. */
export async function getBookingDetail(ctx: DashboardContext, id: string) {
  return prisma.booking.findFirst({
    where: { id, ...teacherScope(ctx) },
    select: {
      ...BOOKING_SELECT,
      levelId: true,
      internalNote: true,
      confirmedAt: true,
      cancelledAt: true,
      updatedAt: true,
      mode: true,
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      location: {
        select: {
          name: true,
          type: true,
          address: true,
          city: true,
          note: true,
        },
      },
      teacherProfile: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  })
}
