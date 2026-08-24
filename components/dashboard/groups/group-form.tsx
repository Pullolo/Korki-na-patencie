"use client"

import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { minutesToTime, timeToMinutes, WEEKDAYS } from "@/lib/format"
import type { CourseGroupInput } from "@/lib/actions/groups"

export type GroupFormOptions = {
  subjects: Array<{ id: string; name: string }>
  levels: Array<{ id: string; name: string }>
  locations: Array<{ id: string; name: string }>
}

export const EMPTY_GROUP: CourseGroupInput = {
  name: "",
  subjectId: null,
  levelId: null,
  description: null,
  minSeats: 4,
  maxSeats: 8,
  meetingsPerMonth: 4,
  meetingMinutes: 60,
  pricePerMonth: 250,
  weekday: 1,
  startMin: 17 * 60,
  locationId: null,
  isActive: true,
  isPublished: false,
}

export function GroupForm({
  initial,
  options,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: CourseGroupInput
  options: GroupFormOptions
  pending: boolean
  error: string | null
  onSubmit: (values: CourseGroupInput) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)

  function set<K extends keyof CourseGroupInput>(
    key: K,
    value: CourseGroupInput[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Nazwa" className="col-span-2">
          <input
            type="text"
            value={values.name}
            placeholder="np. Przygotowanie do matury"
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Poziom">
          <select
            value={values.levelId ?? ""}
            onChange={(e) => set("levelId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">wszystkie</option>
            {options.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Przedmiot">
          <select
            value={values.subjectId ?? ""}
            onChange={(e) => set("subjectId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">bez wskazania</option>
            {options.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dzień">
          <select
            value={values.weekday}
            onChange={(e) => set("weekday", Number(e.target.value))}
            className={inputClass}
          >
            {WEEKDAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Godzina">
          <input
            type="time"
            step={900}
            value={minutesToTime(values.startMin)}
            onChange={(e) => set("startMin", timeToMinutes(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Długość spotkania" hint="minuty">
          <input
            type="number"
            min={15}
            max={480}
            step={15}
            value={values.meetingMinutes}
            onChange={(e) => set("meetingMinutes", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Spotkań w miesiącu">
          <input
            type="number"
            min={1}
            max={31}
            value={values.meetingsPerMonth}
            onChange={(e) => set("meetingsPerMonth", Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="Cena miesięczna">
          <input
            type="number"
            min={1}
            max={100000}
            step={10}
            value={values.pricePerMonth}
            onChange={(e) => set("pricePerMonth", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Miejsc min.">
          <input
            type="number"
            min={1}
            max={50}
            value={values.minSeats}
            onChange={(e) => set("minSeats", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Miejsc maks.">
          <input
            type="number"
            min={1}
            max={50}
            value={values.maxSeats}
            onChange={(e) => set("maxSeats", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Lokalizacja">
          <select
            value={values.locationId ?? ""}
            onChange={(e) => set("locationId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">bez wskazania</option>
            {options.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Opis" className="col-span-2 sm:col-span-4">
          <input
            type="text"
            value={values.description ?? ""}
            placeholder="Co obejmuje abonament"
            onChange={(e) => set("description", e.target.value || null)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="size-3.5 accent-[var(--primary)]"
          />
          Grupa działa (blokuje godziny w grafiku)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={values.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="size-3.5 accent-[var(--primary)]"
          />
          Widoczna na stronie
        </label>
      </div>

      <FormError message={error} />

      <div className="flex gap-2">
        <ActionButton pending={pending} onClick={() => onSubmit(values)}>
          Zapisz grupę
        </ActionButton>
        <ActionButton variant="ghost" onClick={onCancel}>
          Anuluj
        </ActionButton>
      </div>
    </div>
  )
}
