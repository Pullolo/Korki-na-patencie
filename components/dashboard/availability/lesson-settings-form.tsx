"use client"

import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import { updateLessonSettings } from "@/lib/actions/availability"

export type LessonSettingsValues = {
  slotMinutes: number
  bufferMinutes: number
  minLeadHours: number
  maxAdvanceDays: number
}

export function LessonSettingsForm({
  teacherProfileId,
  values,
}: {
  teacherProfileId: string
  values: LessonSettingsValues
}) {
  const { pending, error, done, run, reset } = useServerAction()
  const [form, setForm] = useState(values)

  function update(key: keyof LessonSettingsValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: Number(value) }))
    reset()
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Długość lekcji" hint="minuty">
          <input
            type="number"
            min={15}
            max={480}
            step={15}
            value={form.slotMinutes}
            onChange={(e) => update("slotMinutes", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Przerwa po lekcji" hint="minuty">
          <input
            type="number"
            min={0}
            max={120}
            step={5}
            value={form.bufferMinutes}
            onChange={(e) => update("bufferMinutes", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Min. wyprzedzenie" hint="godziny">
          <input
            type="number"
            min={0}
            max={720}
            value={form.minLeadHours}
            onChange={(e) => update("minLeadHours", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Horyzont zapisów" hint="dni">
          <input
            type="number"
            min={1}
            max={365}
            value={form.maxAdvanceDays}
            onChange={(e) => update("maxAdvanceDays", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <FormError message={error} />

      <ActionButton
        pending={pending}
        done={done}
        doneLabel="Zapisano"
        onClick={() =>
          run(() => updateLessonSettings({ teacherProfileId, ...form }))
        }
      >
        Zapisz ustawienia
      </ActionButton>
    </div>
  )
}
