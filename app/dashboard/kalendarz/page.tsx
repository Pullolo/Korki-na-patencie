import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import {
  ALL_TEACHERS,
  TeacherPicker,
} from "@/components/dashboard/teacher-picker"
import {
  CalendarLegend,
  WeekCalendar,
} from "@/components/dashboard/week-calendar"
import { ensureDashboardPage } from "@/lib/auth"
import { dayKey } from "@/lib/dates"
import { plural } from "@/lib/format"
import { getTeacherOptions } from "@/lib/queries/availability"
import { getWeekSchedule, weekStartFor } from "@/lib/queries/calendar"

export const metadata: Metadata = { title: "Kalendarz" }

function personName(user: {
  firstName: string | null
  lastName: string | null
  email: string
}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
}

function shiftWeek(weekStart: Date, weeks: number) {
  const shifted = new Date(weekStart)
  shifted.setDate(shifted.getDate() + weeks * 7)
  return dayKey(shifted)
}

function parseWeek(value: string | string[] | undefined) {
  if (typeof value !== "string") return weekStartFor(new Date())
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return weekStartFor(new Date())
  return weekStartFor(new Date(year, month - 1, day))
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    tydzien?: string | string[]
    nauczyciel?: string | string[]
  }>
}) {
  const ctx = await ensureDashboardPage()
  const params = await searchParams
  const weekStart = parseWeek(params.tydzien)
  const requested =
    typeof params.nauczyciel === "string" ? params.nauczyciel : undefined

  const teacherOptions = ctx.isAdmin
    ? await getTeacherOptions().catch(() => [])
    : []

  // Admin domyślnie ogląda wszystkich; nauczyciel zawsze tylko siebie.
  const selectedId = ctx.isAdmin
    ? (requested ?? ALL_TEACHERS)
    : (ctx.teacherProfileId ?? "")
  const teacherProfileId =
    selectedId === ALL_TEACHERS ? null : selectedId || null

  if (!ctx.isAdmin && !teacherProfileId) {
    return (
      <div className="flex w-full min-w-0 flex-col">
        <Header title="Kalendarz" />
        <div className="p-4 sm:p-6">
          <Panel bodyClassName="p-0 sm:p-0">
            <EmptyState
              icon={<CalendarDays className="size-6" />}
              title="Brak profilu nauczyciela"
              description="Twoje konto nie ma podpiętego profilu, więc nie ma czego pokazać w kalendarzu."
            />
          </Panel>
        </div>
      </div>
    )
  }

  const { bookings, freeSlots } = await getWeekSchedule(
    teacherProfileId,
    weekStart
  ).catch(() => ({ bookings: [], freeSlots: [] }))

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const rangeLabel = `${weekStart.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })} – ${weekEnd.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}`

  const navParams = (week: string) => {
    const search = new URLSearchParams({ tydzien: week })
    if (ctx.isAdmin) search.set("nauczyciel", selectedId)
    return `/dashboard/kalendarz?${search.toString()}`
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Kalendarz"
        subtitle={rangeLabel}
        actions={
          ctx.isAdmin && teacherOptions.length > 0 ? (
            <TeacherPicker
              basePath="/dashboard/kalendarz"
              selectedId={selectedId}
              allowAll
              extraParams={{ tydzien: dayKey(weekStart) }}
              teachers={teacherOptions.map((teacher) => ({
                id: teacher.id,
                name: personName(teacher.user),
              }))}
            />
          ) : null
        }
      />

      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Link
              href={navParams(shiftWeek(weekStart, -1))}
              className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Poprzedni tydzień"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link
              href={navParams(dayKey(weekStartFor(new Date())))}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Dziś
            </Link>
            <Link
              href={navParams(shiftWeek(weekStart, 1))}
              className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Następny tydzień"
            >
              <ChevronRight className="size-4" />
            </Link>
            <span className="ml-2 text-xs text-muted-foreground">
              {bookings.length}{" "}
              {plural(bookings.length, "lekcja", "lekcje", "lekcji")}
              {teacherProfileId &&
                ` · ${freeSlots.length} ${plural(freeSlots.length, "wolne okienko", "wolne okienka", "wolnych okienek")}`}
            </span>
          </div>

          <CalendarLegend showFree={Boolean(teacherProfileId)} />
        </div>

        <Panel bodyClassName="p-0 sm:p-0">
          {bookings.length === 0 && freeSlots.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-6" />}
              title="Pusty tydzień"
              description={
                teacherProfileId
                  ? "Brak lekcji i wolnych okienek. Sprawdź siatkę tygodnia w sekcji Moja dostępność."
                  : "W tym tygodniu nikt nie ma zaplanowanych lekcji."
              }
            />
          ) : (
            <WeekCalendar
              weekStart={weekStart}
              bookings={bookings}
              freeSlots={freeSlots}
              showTeacher={!teacherProfileId}
            />
          )}
        </Panel>
      </div>
    </div>
  )
}
