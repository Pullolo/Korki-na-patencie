"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
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
  removeTeacherSubject,
  saveTeacherSubject,
  type TeacherSubjectInput,
} from "@/lib/actions/teachers"
import { formatPrice } from "@/lib/format"

export type TeacherSubjectRow = {
  id: string
  subjectId: string
  subjectName: string
  note: string | null
  isActive: boolean
  levelIds: string[]
  /** Stawki policzone z cennika dla poziomów, których uczy — tylko do odczytu. */
  prices: Array<{ levelName: string; pricePerHour: number | null }>
}

export type SubjectOption = { id: string; name: string }
export type LevelOption = { id: string; name: string }

function SubjectRowForm({
  subjectOptions,
  levels,
  initial,
  lockedSubject,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  subjectOptions: SubjectOption[]
  levels: LevelOption[]
  initial: TeacherSubjectInput
  lockedSubject?: string
  pending: boolean
  error: string | null
  onSubmit: (values: TeacherSubjectInput) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)

  function toggleLevel(levelId: string) {
    setValues((prev) => ({
      ...prev,
      levelIds: prev.levelIds.includes(levelId)
        ? prev.levelIds.filter((id) => id !== levelId)
        : [...prev.levelIds, levelId],
    }))
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Przedmiot">
          <select
            value={values.subjectId}
            disabled={Boolean(lockedSubject)}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, subjectId: e.target.value }))
            }
            className={inputClass}
          >
            <option value="">wybierz…</option>
            {subjectOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notatka">
          <input
            type="text"
            value={values.note ?? ""}
            placeholder="np. tylko rozszerzenie"
            onChange={(e) =>
              setValues((prev) => ({ ...prev, note: e.target.value || null }))
            }
            className={inputClass}
          />
        </Field>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Poziomy
        </p>
        <div className="flex flex-wrap gap-1.5">
          {levels.map((level) => {
            const selected = values.levelIds.includes(level.id)
            return (
              <button
                key={level.id}
                onClick={() => toggleLevel(level.id)}
                className={
                  selected
                    ? "cursor-pointer rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                    : "cursor-pointer rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                }
              >
                {level.name}
              </button>
            )
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, isActive: e.target.checked }))
          }
          className="size-3.5 accent-[var(--primary)]"
        />
        Aktywny — uczniowie mogą się zapisać na ten przedmiot
      </label>

      <FormError message={error} />

      <div className="flex gap-2">
        <ActionButton
          pending={pending}
          disabled={!values.subjectId}
          onClick={() => onSubmit(values)}
        >
          Zapisz
        </ActionButton>
        <ActionButton variant="ghost" onClick={onCancel}>
          Anuluj
        </ActionButton>
      </div>
    </div>
  )
}

export function TeacherSubjectsManager({
  teacherProfileId,
  rows,
  subjectOptions,
  levels,
  currency,
  canEditPricing,
}: {
  teacherProfileId: string
  rows: TeacherSubjectRow[]
  subjectOptions: SubjectOption[]
  levels: LevelOption[]
  currency: string
  /** Link do cennika pokazujemy tylko adminowi — to on nim zarządza. */
  canEditPricing: boolean
}) {
  const { pending, error, run } = useServerAction()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const taken = new Set(rows.map((row) => row.subjectId))
  const available = subjectOptions.filter((option) => !taken.has(option.id))

  return (
    <div className="space-y-3">
      {rows.length === 0 && !creating && (
        <p className="text-xs text-muted-foreground">
          Brak przypisanych przedmiotów. Bez nich uczeń nie ma czego wybrać.
        </p>
      )}

      <ul className="space-y-2">
        {rows.map((row) =>
          editingId === row.id ? (
            <li key={row.id}>
              <SubjectRowForm
                subjectOptions={subjectOptions}
                levels={levels}
                lockedSubject={row.subjectId}
                pending={pending}
                error={error}
                initial={{
                  subjectId: row.subjectId,
                  levelIds: row.levelIds,
                  note: row.note,
                  isActive: row.isActive,
                }}
                onCancel={() => setEditingId(null)}
                onSubmit={(values) =>
                  run(
                    () => saveTeacherSubject(teacherProfileId, values),
                    () => setEditingId(null)
                  )
                }
              />
            </li>
          ) : (
            <li
              key={row.id}
              className="rounded-lg border border-border px-3 py-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {row.subjectName}
                  </p>
                  {row.prices.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Brak przypisanych poziomów
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-0.5">
                      {row.prices.map((price) => (
                        <li
                          key={price.levelName}
                          className="flex items-baseline gap-2 text-xs text-muted-foreground"
                        >
                          <span>{price.levelName}</span>
                          <span className="font-medium text-foreground">
                            {price.pricePerHour === null
                              ? "brak stawki w cenniku"
                              : `${formatPrice(price.pricePerHour, currency)}/h`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {row.note && (
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      {row.note}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge
                    label={row.isActive ? "Aktywny" : "Ukryty"}
                    tone={row.isActive ? "green" : "neutral"}
                  />
                  <IconAction
                    title="Edytuj"
                    icon={<Pencil className="size-3.5" />}
                    onClick={() => {
                      setCreating(false)
                      setEditingId(row.id)
                    }}
                  />
                  <IconAction
                    title="Odepnij przedmiot"
                    danger
                    pending={pending}
                    icon={<Trash2 className="size-3.5" />}
                    onClick={() => run(() => removeTeacherSubject(row.id))}
                  />
                </div>
              </div>
            </li>
          )
        )}
      </ul>

      {!editingId && !creating && <FormError message={error} />}

      {creating ? (
        <SubjectRowForm
          subjectOptions={available}
          levels={levels}
          pending={pending}
          error={error}
          initial={{
            subjectId: "",
            levelIds: [],
            note: null,
            isActive: true,
          }}
          onCancel={() => setCreating(false)}
          onSubmit={(values) =>
            run(
              () => saveTeacherSubject(teacherProfileId, values),
              () => setCreating(false)
            )
          }
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            variant="ghost"
            icon={<Plus className="size-3.5" />}
            disabled={available.length === 0}
            title={
              available.length === 0
                ? "Wszystkie przedmioty są już przypisane"
                : undefined
            }
            onClick={() => {
              setEditingId(null)
              setCreating(true)
            }}
          >
            Dodaj przedmiot
          </ActionButton>
          {canEditPricing && (
            <Link
              href="/dashboard/cennik"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Stawki ustawia cennik →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
