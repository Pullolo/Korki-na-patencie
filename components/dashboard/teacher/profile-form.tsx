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
  updateTeacherProfile,
  type TeacherProfileInput,
} from "@/lib/actions/teachers"

export function TeacherProfileForm({
  teacherProfileId,
  initial,
}: {
  teacherProfileId: string
  initial: TeacherProfileInput
}) {
  const { pending, error, done, run, reset } = useServerAction()
  const [values, setValues] = useState(initial)

  function set<K extends keyof TeacherProfileInput>(
    key: K,
    value: TeacherProfileInput[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    reset()
  }

  return (
    <div className="space-y-4">
      <Field
        label="Nagłówek"
        hint="Jedno zdanie, które zobaczy uczeń na liście"
      >
        <input
          type="text"
          value={values.headline ?? ""}
          placeholder="np. Matematyka i fizyka — matura rozszerzona"
          onChange={(e) => set("headline", e.target.value || null)}
          className={inputClass}
        />
      </Field>

      <Field label="O mnie">
        <textarea
          rows={4}
          value={values.bio ?? ""}
          placeholder="Jak uczysz, z kim pracujesz, czego uczeń może się spodziewać"
          onChange={(e) => set("bio", e.target.value || null)}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Wykształcenie" className="col-span-2">
          <input
            type="text"
            value={values.education ?? ""}
            placeholder="np. mgr matematyki, UJ"
            onChange={(e) => set("education", e.target.value || null)}
            className={inputClass}
          />
        </Field>
        <Field label="Lata doświadczenia">
          <input
            type="number"
            min={0}
            max={70}
            value={values.experienceYears ?? ""}
            onChange={(e) =>
              set(
                "experienceYears",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className={inputClass}
          />
        </Field>
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={values.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Profil widoczny na stronie
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={values.isAcceptingStudents}
            onChange={(e) => set("isAcceptingStudents", e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Przyjmuję nowych uczniów
        </label>
        <p className="text-xs text-muted-foreground">
          Profil ukryty nie pojawi się w wyszukiwarce terminów, nawet jeśli masz
          wystawione wolne godziny.
        </p>
      </div>

      <FormError message={error} />

      <ActionButton
        pending={pending}
        done={done}
        doneLabel="Zapisano"
        onClick={() =>
          run(() => updateTeacherProfile(teacherProfileId, values))
        }
      >
        Zapisz profil
      </ActionButton>
    </div>
  )
}
