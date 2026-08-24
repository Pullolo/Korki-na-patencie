import { Users2 } from "lucide-react"
import type { Metadata } from "next"

import { CreateGroup } from "@/components/dashboard/groups/create-group"
import { GroupCard } from "@/components/dashboard/groups/group-card"
import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import {
  ALL_TEACHERS,
  TeacherPicker,
} from "@/components/dashboard/teacher-picker"
import { ensureDashboardPage } from "@/lib/auth"
import { plural } from "@/lib/format"
import { getTeacherOptions } from "@/lib/queries/availability"
import { getLevels, getSubjects } from "@/lib/queries/catalog"
import { getCourseGroups, seatsTaken } from "@/lib/queries/groups"
import { getStudents, getTeacherProfile } from "@/lib/queries/people"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Grupy" }

function personName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ nauczyciel?: string | string[] }>
}) {
  const ctx = await ensureDashboardPage()
  const requested = (await searchParams).nauczyciel
  const requestedId = typeof requested === "string" ? requested : undefined

  const teacherOptions = ctx.isAdmin
    ? await getTeacherOptions().catch(() => [])
    : []

  // Nowa grupa musi mieć właściciela, więc admin najpierw wybiera nauczyciela.
  const ownerId = ctx.isAdmin
    ? requestedId && requestedId !== ALL_TEACHERS
      ? requestedId
      : (teacherOptions[0]?.id ?? null)
    : ctx.teacherProfileId

  const [groups, subjects, levels, students, owner, settings] =
    await Promise.all([
      getCourseGroups(ctx).catch(() => []),
      getSubjects().catch(() => []),
      getLevels().catch(() => []),
      getStudents(ctx).catch(() => []),
      ownerId ? getTeacherProfile(ownerId).catch(() => null) : null,
      getSiteSettingsSafe(),
    ])

  const options = {
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
    })),
    levels: levels.map((level) => ({ id: level.id, name: level.name })),
    locations: (owner?.locations ?? [])
      .filter((location) => location.isActive)
      .map((location) => ({ id: location.id, name: location.name })),
  }

  const studentOptions = students.map((student) => ({
    id: student.id,
    name:
      [student.firstName, student.lastName].filter(Boolean).join(" ") ||
      student.email,
  }))

  const totalSeats = groups.reduce((sum, group) => sum + seatsTaken(group), 0)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Grupy"
        subtitle={`${groups.length} ${plural(groups.length, "grupa", "grupy", "grup")} · ${totalSeats} ${plural(totalSeats, "zapisany uczeń", "zapisanych uczniów", "zapisanych uczniów")}`}
        actions={
          ctx.isAdmin && teacherOptions.length > 0 ? (
            <TeacherPicker
              basePath="/dashboard/grupy"
              selectedId={ownerId ?? ""}
              teachers={teacherOptions.map((teacher) => ({
                id: teacher.id,
                name: personName(teacher.user),
              }))}
            />
          ) : null
        }
      />

      <div className="space-y-4 p-4 sm:p-6">
        {ownerId ? (
          <CreateGroup teacherProfileId={ownerId} options={options} />
        ) : (
          <p className="text-xs text-muted-foreground">
            Nowe grupy zakłada nauczyciel — Twoje konto nie ma podpiętego
            profilu.
          </p>
        )}

        {groups.length === 0 ? (
          <Panel bodyClassName="p-0 sm:p-0">
            <EmptyState
              icon={<Users2 className="size-6" />}
              title="Brak grup"
              description="Grupa spotyka się w stałym terminie i jest rozliczana miesięcznie. Jej godziny blokują zapisy indywidualne w grafiku."
            />
          </Panel>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                currency={settings.currency}
                options={options}
                students={studentOptions}
                group={{
                  id: group.id,
                  name: group.name,
                  subjectId: group.subjectId,
                  levelId: group.levelId,
                  description: group.description,
                  minSeats: group.minSeats,
                  maxSeats: group.maxSeats,
                  meetingsPerMonth: group.meetingsPerMonth,
                  meetingMinutes: group.meetingMinutes,
                  pricePerMonth: group.pricePerMonth,
                  weekday: group.weekday,
                  startMin: group.startMin,
                  locationId: group.locationId,
                  isActive: group.isActive,
                  isPublished: group.isPublished,
                  teacherName: personName({
                    ...group.teacherProfile.user,
                    email: "",
                  }),
                  subjectName: group.subject?.name ?? null,
                  levelName: group.level?.name ?? null,
                  locationName: group.location?.name ?? null,
                  enrollments: group.enrollments.map((enrollment) => ({
                    id: enrollment.id,
                    status: enrollment.status,
                    monthlyPrice: enrollment.monthlyPrice,
                    discountPercent: enrollment.discountPercent,
                    note: enrollment.note,
                    name: enrollment.student
                      ? [
                          enrollment.student.firstName,
                          enrollment.student.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || enrollment.student.email
                      : (enrollment.guestName ?? "Gość"),
                  })),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
