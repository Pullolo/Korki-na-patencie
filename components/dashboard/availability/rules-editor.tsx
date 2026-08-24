"use client"

import { Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import {
  addAvailabilityRule,
  deleteAvailabilityRule,
  toggleAvailabilityRule,
} from "@/lib/actions/availability"
import { minutesToTime, timeToMinutes, WEEKDAYS } from "@/lib/format"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import type { LocationType } from "@/lib/generated/prisma/enums"
import { cn } from "@/lib/utils"

export type RuleRow = {
  id: string
  weekday: number
  startMin: number
  endMin: number
  locationId: string | null
  isActive: boolean
  location: { name: string; type: LocationType } | null
}

export type LocationOption = {
  id: string
  name: string
  type: LocationType
}

export function RulesEditor({
  teacherProfileId,
  rules,
  locations,
}: {
  teacherProfileId: string
  rules: RuleRow[]
  locations: LocationOption[]
}) {
  const { pending, error, run } = useServerAction()
  const [weekday, setWeekday] = useState(1)
  const [start, setStart] = useState("16:00")
  const [end, setEnd] = useState("20:00")
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "")

  return (
    <div className="space-y-5">
      <ul className="space-y-2">
        {WEEKDAYS.map((day) => {
          const dayRules = rules.filter((rule) => rule.weekday === day.value)
          return (
            <li
              key={day.value}
              className="flex flex-wrap items-center gap-2 border-b border-border pb-2 last:border-0"
            >
              <span className="w-28 shrink-0 text-sm font-medium text-foreground">
                {day.label}
              </span>
              {dayRules.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  niedostępny
                </span>
              ) : (
                dayRules.map((rule) => (
                  <span
                    key={rule.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs",
                      rule.isActive
                        ? "bg-card text-foreground"
                        : "bg-muted text-muted-foreground line-through"
                    )}
                  >
                    {minutesToTime(rule.startMin)}–{minutesToTime(rule.endMin)}
                    {rule.location && (
                      <span className="text-muted-foreground">
                        · {LOCATION_TYPE_LABELS[rule.location.type]}
                      </span>
                    )}
                    <button
                      onClick={() => run(() => toggleAvailabilityRule(rule.id))}
                      disabled={pending}
                      className="cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-50"
                      title={rule.isActive ? "Wyłącz regułę" : "Włącz regułę"}
                    >
                      {rule.isActive ? (
                        <Eye className="size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => run(() => deleteAvailabilityRule(rule.id))}
                      disabled={pending}
                      className="cursor-pointer text-muted-foreground hover:text-destructive disabled:opacity-50"
                      title="Usuń regułę"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                ))
              )}
            </li>
          )
        })}
      </ul>

      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Dzień">
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              className={inputClass}
            >
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </Field>
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
          <Field label="Gdzie">
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={inputClass}
              disabled={locations.length === 0}
            >
              {locations.length === 0 && <option value="">brak</option>}
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <FormError message={error} />

        <button
          onClick={() =>
            run(() =>
              addAvailabilityRule({
                teacherProfileId,
                weekday,
                startMin: timeToMinutes(start),
                endMin: timeToMinutes(end),
                locationId: locationId || null,
              })
            )
          }
          disabled={pending}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Dodaj godziny
        </button>
      </div>
    </div>
  )
}
