"use client"

import { CalendarOff, CalendarPlus, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"

import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { useServerAction } from "@/hooks/use-server-action"
import {
  addAvailabilityException,
  deleteAvailabilityException,
} from "@/lib/actions/availability"
import { minutesToTime, timeToMinutes } from "@/lib/format"
import type { ExceptionType, LocationType } from "@/lib/generated/prisma/enums"
import { cn } from "@/lib/utils"

export type ExceptionRow = {
  id: string
  /** Wyświetlana data w formacie "RRRR-MM-DD" — policzona po stronie serwera. */
  dateLabel: string
  type: ExceptionType
  startMin: number | null
  endMin: number | null
  reason: string | null
}

export function ExceptionsEditor({
  teacherProfileId,
  exceptions,
  locations,
}: {
  teacherProfileId: string
  exceptions: ExceptionRow[]
  locations: Array<{ id: string; name: string; type: LocationType }>
}) {
  const { pending, error, run } = useServerAction()
  const [type, setType] = useState<ExceptionType>("BLOCK")
  const [date, setDate] = useState("")
  const [wholeDay, setWholeDay] = useState(true)
  const [start, setStart] = useState("16:00")
  const [end, setEnd] = useState("18:00")
  const [locationId, setLocationId] = useState("")
  const [reason, setReason] = useState("")

  const isBlock = type === "BLOCK"
  const usesHours = !isBlock || !wholeDay

  return (
    <div className="space-y-5">
      {exceptions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Brak wyjątków. Siatka tygodnia obowiązuje bez zmian.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {exceptions.map((exception) => (
            <li
              key={exception.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <StatusBadge
                  label={exception.type === "BLOCK" ? "Blokada" : "Dodatkowo"}
                  tone={exception.type === "BLOCK" ? "red" : "green"}
                />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    {exception.dateLabel}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {exception.startMin !== null && exception.endMin !== null
                        ? `${minutesToTime(exception.startMin)}–${minutesToTime(exception.endMin)}`
                        : "cały dzień"}
                    </span>
                  </p>
                  {exception.reason && (
                    <p className="truncate text-xs text-muted-foreground">
                      {exception.reason}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() =>
                  run(() => deleteAvailabilityException(exception.id))
                }
                disabled={pending}
                className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive disabled:opacity-50"
                title="Usuń wyjątek"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex gap-2">
          {(["BLOCK", "EXTRA"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setType(option)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                type === option
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {option === "BLOCK" ? (
                <CalendarOff className="size-3.5" />
              ) : (
                <CalendarPlus className="size-3.5" />
              )}
              {option === "BLOCK" ? "Blokuję termin" : "Dodatkowe okienko"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Data">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>

          {isBlock && (
            <Field label="Zakres">
              <select
                value={wholeDay ? "day" : "hours"}
                onChange={(e) => setWholeDay(e.target.value === "day")}
                className={inputClass}
              >
                <option value="day">Cały dzień</option>
                <option value="hours">Wybrane godziny</option>
              </select>
            </Field>
          )}

          {usesHours && (
            <>
              <Field label="Od">
                <input
                  type="time"
                  value={start}
                  step={900}
                  onChange={(e) => setStart(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Do">
                <input
                  type="time"
                  value={end}
                  step={900}
                  onChange={(e) => setEnd(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          )}

          {!isBlock && locations.length > 0 && (
            <Field label="Gdzie">
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className={inputClass}
              >
                <option value="">bez wskazania</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Powód" className="col-span-2">
            <input
              type="text"
              value={reason}
              placeholder={isBlock ? "np. urlop" : "np. dodatkowa sobota"}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <FormError message={error} />

        <button
          onClick={() =>
            run(async () => {
              if (!date) throw new Error("Podaj datę.")
              await addAvailabilityException({
                teacherProfileId,
                date,
                type,
                startMin: usesHours ? timeToMinutes(start) : null,
                endMin: usesHours ? timeToMinutes(end) : null,
                locationId: !isBlock && locationId ? locationId : null,
                reason: reason || null,
              })
              setReason("")
              setDate("")
            })
          }
          disabled={pending}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Dodaj wyjątek
        </button>
      </div>
    </div>
  )
}
