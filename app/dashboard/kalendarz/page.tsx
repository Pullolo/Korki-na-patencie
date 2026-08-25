import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { CreateBooking } from "@/components/dashboard/bookings/create-booking"
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
import { formatTime, personName, plural } from "@/lib/format"
import { getTeacherOptions } from "@/lib/queries/availability"
import { getBookingFormOptions } from "@/lib/queries/bookings"
import { getWeekSchedule, weekStartFor } from "@/lib/queries/calendar"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Kalendarz" }

function shiftWeek(weekStart: Date, weeks: number) {
  const shifted = new Date(weekStart)
  shifted.setDate(shifted.getDate() + weeks * 7)
  return dayKey(shifted)
}

/** „2026-08-26T17:00" z kliknięcia w wolne okienko → data i godzina formularza. */
function parseNewLesson(value: string | string[] | undefined) {
  if (typeof value !== "string") return null
  const [date, time] = value.split("T")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) return null
  if (!/^\d{2}:\d{2}$/.test(time ?? "")) return null
  return { date, time }
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
    nowa?: string | string[]
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

  const [schedule, formOptions, settings] = await Promise.all([
    getWeekSchedule(teacherProfileId, weekStart).catch(() => ({
      bookings: [],
      freeSlots: [],
      groupMeetings: [],
    })),
    getBookingFormOptions(ctx).catch(() => null),
    getSiteSettingsSafe(),
  ])
  const { bookings, freeSlots, groupMeetings } = schedule
  const newLesson = parseNewLesson(params.nowa)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const rangeLabel = `${weekStart.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })} – ${weekEnd.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}`

  const navParams = (week: string, extra?: Record<string, string>) => {
    const search = new URLSearchParams({ tydzien: week, ...extra })
    if (ctx.isAdmin) search.set("nauczyciel", selectedId)
    return `/dashboard/kalendarz?${search.toString()}`
  }

  const weekHref = navParams(dayKey(weekStart))
  // Klik w wolne okienko wraca na tę samą stronę z terminem w adresie —
  // formularz otwiera się już wypełniony, bez przeładowania stanu w kliencie.
  const slotHref = (slot: { startsAt: Date }) =>
    navParams(dayKey(weekStart), {
      nowa: `${dayKey(slot.startsAt)}T${formatTime(slot.startsAt)}`,
    })

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
              {groupMeetings.length > 0 &&
                ` · ${groupMeetings.length} ${plural(groupMeetings.length, "spotkanie grupy", "spotkania grup", "spotkań grup")}`}
              {teacherProfileId &&
                ` · ${freeSlots.length} ${plural(freeSlots.length, "wolne okienko", "wolne okienka", "wolnych okienek")}`}
            </span>
          </div>

          <CalendarLegend
            showFree={Boolean(teacherProfileId)}
            showGroups={groupMeetings.length > 0}
          />
        </div>

        {formOptions && (
          <CreateBooking
            key={params.nowa?.toString() ?? "nowa"}
            options={formOptions}
            currency={settings.currency}
            defaultTeacherId={teacherProfileId}
            initialDate={newLesson?.date}
            initialTime={newLesson?.time}
            autoOpen={Boolean(newLesson)}
            closeHref={weekHref}
          />
        )}

        <Panel bodyClassName="p-0 sm:p-0">
          {bookings.length === 0 &&
          freeSlots.length === 0 &&
          groupMeetings.length === 0 ? (
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
              groupMeetings={groupMeetings}
              showTeacher={!teacherProfileId}
              slotHref={teacherProfileId ? slotHref : undefined}
            />
          )}
        </Panel>
      </div>
    </div>
  )
}
