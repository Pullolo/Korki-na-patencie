import { CalendarClock, GraduationCap } from "lucide-react"
import type { Metadata } from "next"

import { ExceptionsEditor } from "@/components/dashboard/availability/exceptions-editor"
import { LessonSettingsForm } from "@/components/dashboard/availability/lesson-settings-form"
import { RulesEditor } from "@/components/dashboard/availability/rules-editor"
import { TeacherPicker } from "@/components/dashboard/teacher-picker"
import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { ensureDashboardPage } from "@/lib/auth"
import { dateOnlyKey } from "@/lib/dates"
import {
  formatLongDate,
  formatTime,
  personName,
  plural,
} from "@/lib/format"
import {
  getAvailabilityPreview,
  getTeacherOptions,
  getTeacherSchedule,
} from "@/lib/queries/availability"

export const metadata: Metadata = { title: "Moja dostępność" }

const PREVIEW_DAYS = 14

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ nauczyciel?: string | string[] }>
}) {
  const ctx = await ensureDashboardPage()
  const requested = (await searchParams).nauczyciel
  const requestedId = typeof requested === "string" ? requested : undefined

  // Nauczyciel zawsze ogląda swój grafik; admin wybiera, czyj chce zobaczyć —
  // a jeśli sam prowadzi zajęcia, domyślnie ląduje na własnym.
  const teacherOptions = ctx.isAdmin
    ? await getTeacherOptions().catch(() => [])
    : []
  const teacherProfileId = ctx.isAdmin
    ? (requestedId ?? ctx.teacherProfileId ?? teacherOptions[0]?.id)
    : ctx.teacherProfileId

  if (!teacherProfileId) {
    return (
      <div className="flex w-full min-w-0 flex-col">
        <Header title="Moja dostępność" />
        <div className="p-4 sm:p-6">
          <Panel bodyClassName="p-0 sm:p-0">
            <EmptyState
              icon={<GraduationCap className="size-6" />}
              title="Brak profilu nauczyciela"
              description={
                ctx.isAdmin
                  ? "Nikt nie ma jeszcze profilu nauczyciela — nadaj rolę Nauczyciel albo załóż profil sobie w sekcji Użytkownicy."
                  : "Twoje konto nie ma podpiętego profilu nauczyciela. Odezwij się do administratora."
              }
            />
          </Panel>
        </div>
      </div>
    )
  }

  const [schedule, preview] = await Promise.all([
    getTeacherSchedule(teacherProfileId),
    getAvailabilityPreview(teacherProfileId, PREVIEW_DAYS).catch(() => []),
  ])

  if (!schedule) {
    return (
      <div className="flex w-full min-w-0 flex-col">
        <Header title="Moja dostępność" />
        <div className="p-4 sm:p-6">
          <Panel bodyClassName="p-0 sm:p-0">
            <EmptyState
              icon={<GraduationCap className="size-6" />}
              title="Nie znaleziono profilu"
            />
          </Panel>
        </div>
      </div>
    )
  }

  const totalSlots = preview.reduce((sum, day) => sum + day.slots.length, 0)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Moja dostępność"
        subtitle={
          ctx.isAdmin
            ? `Grafik: ${personName(schedule.user)}`
            : "Godziny, w których uczniowie mogą się do Ciebie zapisać"
        }
        actions={
          ctx.isAdmin && teacherOptions.length > 0 ? (
            <TeacherPicker
              basePath="/dashboard/dostepnosc"
              selectedId={teacherProfileId}
              teachers={teacherOptions.map((teacher) => ({
                id: teacher.id,
                name: personName(teacher.user),
              }))}
            />
          ) : null
        }
      />

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <Panel
          title="Ustawienia lekcji"
          description="Decydują, na jakie kawałki tnie się Twój grafik"
        >
          <LessonSettingsForm
            teacherProfileId={schedule.id}
            values={{
              slotMinutes: schedule.slotMinutes,
              bufferMinutes: schedule.bufferMinutes,
              minLeadHours: schedule.minLeadHours,
              maxAdvanceDays: schedule.maxAdvanceDays,
            }}
          />
        </Panel>

        <Panel
          title="Siatka tygodnia"
          description="Godziny, które powtarzają się co tydzień"
        >
          {schedule.locations.length === 0 && (
            <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Ten nauczyciel nie ma żadnej aktywnej lokalizacji. Godziny da się
              dodać, ale uczeń nie zobaczy, gdzie odbywają się zajęcia.
            </p>
          )}
          <RulesEditor
            teacherProfileId={schedule.id}
            rules={schedule.availabilityRules}
            locations={schedule.locations}
          />
        </Panel>

        <Panel
          title="Wyjątki"
          description="Urlopy, pojedyncze blokady i dodatkowe okienka poza siatką"
        >
          <ExceptionsEditor
            teacherProfileId={schedule.id}
            locations={schedule.locations}
            exceptions={schedule.availabilityExceptions.map((exception) => ({
              id: exception.id,
              // Kolumna @db.Date przychodzi jako północ UTC — czytamy ją getterami UTC.
              dateLabel: dateOnlyKey(exception.date),
              type: exception.type,
              startMin: exception.startMin,
              endMin: exception.endMin,
              reason: exception.reason,
            }))}
          />
        </Panel>

        <Panel
          title="Wolne terminy"
          description={`Najbliższe ${PREVIEW_DAYS} dni — tak wyliczy je wyszukiwarka na stronie`}
          actions={
            <span className="text-xs text-muted-foreground">
              {totalSlots} {plural(totalSlots, "termin", "terminy", "terminów")}
            </span>
          }
          bodyClassName="p-0 sm:p-0"
        >
          {totalSlots === 0 ? (
            <EmptyState
              icon={<CalendarClock className="size-6" />}
              title="Brak wolnych terminów"
              description="Sprawdź siatkę tygodnia, wyjątki oraz minimalne wyprzedzenie — któryś z nich zjada wszystkie okienka."
            />
          ) : (
            <ul className="divide-y divide-border">
              {preview
                .filter((day) => day.slots.length > 0 || day.blockedReason)
                .map((day) => (
                  <li
                    key={day.date.toISOString()}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 sm:px-5"
                  >
                    <span className="w-44 shrink-0 text-sm font-medium text-foreground">
                      {formatLongDate(day.date)}
                    </span>
                    {day.blockedReason ? (
                      <span className="text-xs text-muted-foreground">
                        {day.blockedReason}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {day.slots.map((slot) => (
                          <span
                            key={slot.startsAt.toISOString()}
                            className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground"
                          >
                            {formatTime(slot.startsAt)}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
