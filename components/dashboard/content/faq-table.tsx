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
  createFaq,
  deleteFaq,
  updateFaq,
  type FaqInput,
} from "@/lib/actions/content"

export type FaqRow = FaqInput & { id: string }

const EMPTY: FaqInput = {
  question: "",
  answer: "",
  category: null,
  order: 0,
  isPublished: true,
}

function FaqForm({
  initial,
  categories,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: FaqInput
  categories: string[]
  pending: boolean
  error: string | null
  onSubmit: (values: FaqInput) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)

  function set<K extends keyof FaqInput>(key: K, value: FaqInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-3 bg-muted/30 p-4 sm:p-5">
      <Field label="Pytanie">
        <input
          type="text"
          value={values.question}
          onChange={(e) => set("question", e.target.value)}
          placeholder="np. Kiedy najpóźniej mogę odwołać lekcję?"
          className={inputClass}
        />
      </Field>

      <Field
        label="Odpowiedź"
        hint="Pełne zdania — ta treść trafia wprost na stronę."
      >
        <textarea
          rows={4}
          value={values.answer}
          onChange={(e) => set("answer", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Kategoria"
          hint="Grupuje pytania na stronie /faq. Nazwa przedmiotu pokazuje pytanie także na jego podstronie."
        >
          <input
            type="text"
            list="faq-kategorie"
            value={values.category ?? ""}
            onChange={(e) => set("category", e.target.value || null)}
            placeholder="np. Płatności"
            className={inputClass}
          />
          <datalist id="faq-kategorie">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
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
          checked={values.isPublished}
          onChange={(e) => set("isPublished", e.target.checked)}
          className="size-3.5 accent-[var(--primary)]"
        />
        Widoczne na stronie
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

export function FaqTable({ items }: { items: FaqRow[] }) {
  const { pending, error, run } = useServerAction()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const categories = [
    ...new Set(
      items
        .map((item) => item.category)
        .filter((category): category is string => Boolean(category))
    ),
  ]

  return (
    <div>
      <ul className="divide-y divide-border">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id}>
              <FaqForm
                initial={item}
                categories={categories}
                pending={pending}
                error={error}
                onCancel={() => setEditingId(null)}
                onSubmit={(values) =>
                  run(
                    () => updateFaq(item.id, values),
                    () => setEditingId(null)
                  )
                }
              />
            </li>
          ) : (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {item.question}
                  </p>
                  {item.category && (
                    <StatusBadge label={item.category} tone="blue" />
                  )}
                  {!item.isPublished && (
                    <StatusBadge label="Ukryte" tone="neutral" />
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {item.answer}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconAction
                  title="Edytuj"
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => {
                    setCreating(false)
                    setEditingId(item.id)
                  }}
                />
                <IconAction
                  title="Usuń"
                  danger
                  pending={pending}
                  icon={<Trash2 className="size-3.5" />}
                  onClick={() => run(() => deleteFaq(item.id))}
                />
              </div>
            </li>
          )
        )}
      </ul>

      {!editingId && !creating && error && (
        <div className="px-4 pb-3 sm:px-5">
          <FormError message={error} />
        </div>
      )}

      {creating ? (
        <FaqForm
          initial={{ ...EMPTY, order: items.length + 1 }}
          categories={categories}
          pending={pending}
          error={error}
          onCancel={() => setCreating(false)}
          onSubmit={(values) =>
            run(
              () => createFaq(values),
              () => setCreating(false)
            )
          }
        />
      ) : (
        <div className="border-t border-border p-3 sm:px-5">
          <ActionButton
            variant="ghost"
            icon={<Plus className="size-3.5" />}
            onClick={() => {
              setEditingId(null)
              setCreating(true)
            }}
          >
            Dodaj pytanie
          </ActionButton>
        </div>
      )}
    </div>
  )
}
