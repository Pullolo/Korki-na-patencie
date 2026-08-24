"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { ActionButton, IconAction } from "@/components/dashboard/action-button"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { useServerAction } from "@/hooks/use-server-action"
import {
  createSubject,
  deleteSubject,
  updateSubject,
  type SubjectInput,
} from "@/lib/actions/catalog"

export type SubjectRow = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  isActive: boolean
  order: number
  teacherCount: number
  bookingCount: number
}

const EMPTY: SubjectInput = {
  name: "",
  description: null,
  color: "#6366f1",
  isActive: true,
  order: 0,
}

function SubjectForm({
  initial,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: SubjectInput
  pending: boolean
  error: string | null
  onSubmit: (values: SubjectInput) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)

  function set<K extends keyof SubjectInput>(key: K, value: SubjectInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-3 bg-muted/30 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Nazwa" className="col-span-2">
          <input
            type="text"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="np. Matematyka"
            className={inputClass}
          />
        </Field>
        <Field label="Kolor">
          <input
            type="color"
            value={values.color ?? "#6366f1"}
            onChange={(e) => set("color", e.target.value)}
            className={`${inputClass} h-[34px] p-1`}
          />
        </Field>
        <Field label="Opis" className="col-span-2 sm:col-span-3">
          <input
            type="text"
            value={values.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
            placeholder="Krótki opis widoczny na stronie"
            className={inputClass}
          />
        </Field>
        <Field label="Kolejność">
          <input
            type="number"
            value={values.order}
            onChange={(e) => set("order", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="size-3.5 accent-[var(--primary)]"
        />
        Widoczny w ofercie
      </label>

      <FormError message={error} />

      <div className="flex gap-2">
        <ActionButton pending={pending} onClick={() => onSubmit(values)}>
          Zapisz
        </ActionButton>
        <ActionButton variant="ghost" onClick={onCancel}>
          Anuluj
        </ActionButton>
      </div>
    </div>
  )
}

export function SubjectsTable({ subjects }: { subjects: SubjectRow[] }) {
  const { pending, error, run } = useServerAction()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium sm:px-5">Nazwa</th>
              <th className="px-4 py-3 font-medium">Nauczyciele</th>
              <th className="px-4 py-3 font-medium">Rezerwacje</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium sm:px-5">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subjects.map((subject) =>
              editingId === subject.id ? (
                <tr key={subject.id}>
                  <td colSpan={5} className="p-0">
                    <SubjectForm
                      initial={{
                        name: subject.name,
                        description: subject.description,
                        color: subject.color,
                        isActive: subject.isActive,
                        order: subject.order,
                      }}
                      pending={pending}
                      error={error}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(values) =>
                        run(
                          () => updateSubject(subject.id, values),
                          () => setEditingId(null)
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                <tr
                  key={subject.id}
                  className="transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            subject.color ?? "var(--muted-foreground)",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {subject.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {subject.description ?? subject.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {subject.teacherCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {subject.bookingCount}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={subject.isActive ? "Aktywny" : "Ukryty"}
                      tone={subject.isActive ? "green" : "neutral"}
                    />
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-end gap-1">
                      <IconAction
                        title="Edytuj"
                        icon={<Pencil className="size-3.5" />}
                        onClick={() => {
                          setCreating(false)
                          setEditingId(subject.id)
                        }}
                      />
                      <IconAction
                        title="Usuń"
                        danger
                        pending={pending}
                        icon={<Trash2 className="size-3.5" />}
                        onClick={() => run(() => deleteSubject(subject.id))}
                      />
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Błąd kasowania nie ma gdzie się pokazać w wierszu, więc ląduje pod tabelą. */}
      {!editingId && !creating && error && (
        <div className="px-4 pb-3 sm:px-5">
          <FormError message={error} />
        </div>
      )}

      {creating ? (
        <SubjectForm
          initial={{ ...EMPTY, order: subjects.length }}
          pending={pending}
          error={error}
          onCancel={() => setCreating(false)}
          onSubmit={(values) =>
            run(
              () => createSubject(values),
              () => setCreating(false)
            )
          }
        />
      ) : (
        <div className="border-t border-border px-4 py-3 sm:px-5">
          <ActionButton
            variant="ghost"
            icon={<Plus className="size-3.5" />}
            onClick={() => {
              setEditingId(null)
              setCreating(true)
            }}
          >
            Dodaj przedmiot
          </ActionButton>
        </div>
      )}
    </div>
  )
}
