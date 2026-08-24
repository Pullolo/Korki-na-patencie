import { teacherScope, type DashboardContext } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type CourseGroupRow = Awaited<ReturnType<typeof getCourseGroups>>[number]

const GROUP_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  teacherProfileId: true,
  subjectId: true,
  levelId: true,
  minSeats: true,
  maxSeats: true,
  meetingsPerMonth: true,
  meetingMinutes: true,
  pricePerMonth: true,
  weekday: true,
  startMin: true,
  locationId: true,
  startsOn: true,
  endsOn: true,
  isActive: true,
  isPublished: true,
  subject: { select: { name: true } },
  level: { select: { name: true } },
  location: { select: { name: true, type: true } },
  teacherProfile: {
    select: { user: { select: { firstName: true, lastName: true } } },
  },
  enrollments: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      status: true,
      monthlyPrice: true,
      discountPercent: true,
      startedOn: true,
      note: true,
      guestName: true,
      student: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
} as const

export async function getCourseGroups(ctx: DashboardContext) {
  return prisma.courseGroup.findMany({
    where: teacherScope(ctx),
    orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
    select: GROUP_SELECT,
  })
}

/** Grafik grup potrzebny do liczenia zajętych godzin nauczyciela. */
export async function getTeacherGroupSchedules(teacherProfileId: string) {
  return prisma.courseGroup.findMany({
    where: { teacherProfileId, isActive: true },
    select: {
      weekday: true,
      startMin: true,
      meetingMinutes: true,
      startsOn: true,
      endsOn: true,
      isActive: true,
    },
  })
}

export function seatsTaken(group: {
  enrollments: Array<{ status: string }>
}) {
  return group.enrollments.filter((item) => item.status === "ACTIVE").length
}
