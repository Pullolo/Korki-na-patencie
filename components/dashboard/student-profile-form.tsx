"use client"

import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import {
  updateStudentProfile,
  type StudentProfileInput,
} from "@/lib/actions/students"

export function StudentProfileForm({
  userId,
  initial,
  levels,
}: {
  userId: string
  initial: StudentProfileInput
  levels: Array<{ id: string; name: string }>
}) {
  const { pending, error, done, run, reset } = useServerAction()
  const [values, setValues] = useState(initial)

  function set<K extends keyof StudentProfileInput>(
    key: K,
    value: StudentProfileInput[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    reset()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Poziom">
          <select
            value={values.levelId ?? ""}
            onChange={(e) => set("levelId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">nie ustawiono</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Klasa">
          <input
            type="text"
            value={values.schoolClass ?? ""}
            placeholder="np. 3 liceum"
            onChange={(e) => set("schoolClass", e.target.value || null)}
            className={inputClass}
          />
        </Field>
        <Field label="Szkoła" className="sm:col-span-2">
          <input
            type="text"
            value={values.schoolName ?? ""}
            onChange={(e) => set("schoolName", e.target.value || null)}
            className={inputClass}
          />
        </Field>
        <Field label="Rodzic lub opiekun">
          <input
            type="text"
            value={values.guardianName ?? ""}
            onChange={(e) => set("guardianName", e.target.value || null)}
            className={inputClass}
          />
        </Field>
        <Field label="Telefon do opiekuna">
          <input
            type="tel"
            value={values.guardianPhone ?? ""}
            onChange={(e) => set("guardianPhone", e.target.value || null)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notatki" hint="Widoczne tylko w panelu">
        <textarea
          rows={4}
          value={values.notes ?? ""}
          placeholder="Nad czym pracujecie, na co uważać, czego uczeń nie lubi"
          onChange={(e) => set("notes", e.target.value || null)}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <FormError message={error} />

      <ActionButton
        pending={pending}
        done={done}
        doneLabel="Zapisano"
        onClick={() => run(() => updateStudentProfile(userId, values))}
      >
        Zapisz kartę ucznia
      </ActionButton>
    </div>
  )
}
