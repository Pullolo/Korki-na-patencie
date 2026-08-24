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
  createLocation,
  deleteLocation,
  updateLocation,
  type LocationInput,
} from "@/lib/actions/catalog"
import { LocationType } from "@/lib/generated/prisma/enums"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"

export type LocationRow = {
  id: string
  name: string
  type: LocationType
  address: string | null
  city: string | null
  note: string | null
  isActive: boolean
  order: number
}

const EMPTY: LocationInput = {
  name: "",
  type: "ONLINE",
  address: null,
  city: null,
  note: null,
  isActive: true,
  order: 0,
}

const NOTE_HINTS: Record<LocationType, string> = {
  ONLINE: "Link do spotkania albo nazwa komunikatora",
  TEACHER_PLACE: "Wskazówki dojazdu, piętro, kod do domofonu",
  STUDENT_PLACE: "Zasięg dojazdu i ewentualna dopłata",
}

function LocationForm({
  initial,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: LocationInput
  pending: boolean
  error: string | null
  onSubmit: (values: LocationInput) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)

  function set<K extends keyof LocationInput>(key: K, value: LocationInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Nazwa" className="col-span-2">
          <input
            type="text"
            value={values.name}
            placeholder="np. U mnie w domu"
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Tryb">
          <select
            value={values.type}
            onChange={(e) => set("type", e.target.value as LocationType)}
            className={inputClass}
          >
            {Object.values(LocationType).map((type) => (
              <option key={type} value={type}>
                {LOCATION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kolejność">
          <input
            type="number"
            value={values.order}
            onChange={(e) => set("order", Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        {values.type !== "ONLINE" && (
          <>
            <Field label="Adres" className="col-span-2">
              <input
                type="text"
                value={values.address ?? ""}
                placeholder={
                  values.type === "TEACHER_PLACE" ? "ul. Długa 12" : "—"
                }
                onChange={(e) => set("address", e.target.value || null)}
                className={inputClass}
              />
            </Field>
            <Field label="Miasto" className="col-span-2">
              <input
                type="text"
                value={values.city ?? ""}
                placeholder="Kraków"
                onChange={(e) => set("city", e.target.value || null)}
                className={inputClass}
              />
            </Field>
          </>
        )}

        <Field
          label="Notatka"
          className="col-span-2 sm:col-span-4"
          hint={NOTE_HINTS[values.type]}
        >
          <input
            type="text"
            value={values.note ?? ""}
            onChange={(e) => set("note", e.target.value || null)}
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
        Aktywna — można ją wybrać przy godzinach i rezerwacjach
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

export function LocationsManager({
  teacherProfileId,
  locations,
}: {
  teacherProfileId: string
  locations: LocationRow[]
}) {
  const { pending, error, run } = useServerAction()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-3">
      {locations.length === 0 && !creating && (
        <p className="text-xs text-muted-foreground">
          Brak lokalizacji. Bez niej uczeń nie dowie się, gdzie odbywają się
          zajęcia.
        </p>
      )}

      <ul className="space-y-2">
        {locations.map((location) =>
          editingId === location.id ? (
            <li key={location.id}>
              <LocationForm
                initial={location}
                pending={pending}
                error={error}
                onCancel={() => setEditingId(null)}
                onSubmit={(values) =>
                  run(
                    () => updateLocation(location.id, values),
                    () => setEditingId(null)
                  )
                }
              />
            </li>
          ) : (
            <li
              key={location.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {location.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {LOCATION_TYPE_LABELS[location.type]}
                  {location.address && ` · ${location.address}`}
                  {location.city && `, ${location.city}`}
                </p>
                {location.note && (
                  <p className="truncate text-xs text-muted-foreground/80">
                    {location.note}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <StatusBadge
                  label={location.isActive ? "Aktywna" : "Ukryta"}
                  tone={location.isActive ? "green" : "neutral"}
                />
                <IconAction
                  title="Edytuj"
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => {
                    setCreating(false)
                    setEditingId(location.id)
                  }}
                />
                <IconAction
                  title="Usuń"
                  danger
                  pending={pending}
                  icon={<Trash2 className="size-3.5" />}
                  onClick={() => run(() => deleteLocation(location.id))}
                />
              </div>
            </li>
          )
        )}
      </ul>

      {!editingId && !creating && <FormError message={error} />}

      {creating ? (
        <LocationForm
          initial={{ ...EMPTY, order: locations.length }}
          pending={pending}
          error={error}
          onCancel={() => setCreating(false)}
          onSubmit={(values) =>
            run(
              () => createLocation(teacherProfileId, values),
              () => setCreating(false)
            )
          }
        />
      ) : (
        <ActionButton
          variant="ghost"
          icon={<Plus className="size-3.5" />}
          onClick={() => {
            setEditingId(null)
            setCreating(true)
          }}
        >
          Dodaj lokalizację
        </ActionButton>
      )}
    </div>
  )
}
