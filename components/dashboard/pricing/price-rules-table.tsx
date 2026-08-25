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
  createPriceRule,
  deletePriceRule,
  updatePriceRule,
  type PriceRuleInput,
} from "@/lib/actions/pricing"
import { formatPrice } from "@/lib/format"
import { ruleSpecificity } from "@/lib/pricing"

export type PriceRuleRowData = PriceRuleInput & {
  id: string
  levelName: string | null
  subjectName: string | null
  teacherName: string | null
}

export type Option = { id: string; name: string }

const EMPTY: PriceRuleInput = {
  levelId: null,
  subjectId: null,
  teacherProfileId: null,
  pricePerHour: 100,
  note: null,
  isActive: true,
}

function scopeLabel(rule: {
  levelName: string | null
  subjectName: string | null
  teacherName: string | null
}) {
  const parts = [
    rule.levelName ?? "wszystkie poziomy",
    rule.subjectName ?? "wszystkie przedmioty",
    rule.teacherName ?? "wszyscy nauczyciele",
  ]
  return parts.join(" · ")
}

function RuleForm({
  initial,
  levels,
  subjects,
  teachers,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: PriceRuleInput
  levels: Option[]
  subjects: Option[]
  teachers: Option[]
  pending: boolean
  error: string | null
  onSubmit: (values: PriceRuleInput) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)

  function set<K extends keyof PriceRuleInput>(
    key: K,
    value: PriceRuleInput[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-3 bg-muted/30 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Poziom">
          <select
            value={values.levelId ?? ""}
            onChange={(e) => set("levelId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">wszystkie</option>
            {levels.map((level) => (
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
            <option value="">wszystkie</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nauczyciel">
          <select
            value={values.teacherProfileId ?? ""}
            onChange={(e) => set("teacherProfileId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">wszyscy</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stawka za godzinę">
          <input
            type="number"
            min={1}
            max={10000}
            step={10}
            value={values.pricePerHour}
            onChange={(e) => set("pricePerHour", Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Notatka" className="col-span-2 sm:col-span-4">
          <input
            type="text"
            value={values.note ?? ""}
            placeholder="np. przygotowanie do matury rozszerzonej"
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
        Reguła obowiązuje
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

export function PriceRulesTable({
  rules,
  levels,
  subjects,
  teachers,
  currency,
}: {
  rules: PriceRuleRowData[]
  levels: Option[]
  subjects: Option[]
  teachers: Option[]
  currency: string
}) {
  const { pending, error, run } = useServerAction()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium sm:px-5">Zakres</th>
              <th className="px-4 py-3 font-medium">Stawka / h</th>
              <th className="px-4 py-3 font-medium">Szczegółowość</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium sm:px-5">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rules.map((rule) =>
              editingId === rule.id ? (
                <tr key={rule.id}>
                  <td colSpan={5} className="p-0">
                    <RuleForm
                      initial={rule}
                      levels={levels}
                      subjects={subjects}
                      teachers={teachers}
                      pending={pending}
                      error={error}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(values) =>
                        run(
                          () => updatePriceRule(rule.id, values),
                          () => setEditingId(null)
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                <tr
                  key={rule.id}
                  className="transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 sm:px-5">
                    <p className="text-foreground">{scopeLabel(rule)}</p>
                    {rule.note && (
                      <p className="text-xs text-muted-foreground">
                        {rule.note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                    {formatPrice(rule.pricePerHour, currency)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span
                      title="Wyższa wygrywa, gdy pasuje więcej niż jedna reguła"
                      className="font-mono text-xs"
                    >
                      {ruleSpecificity(rule)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={rule.isActive ? "Obowiązuje" : "Wyłączona"}
                      tone={rule.isActive ? "green" : "neutral"}
                    />
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-end gap-1">
                      <IconAction
                        title="Edytuj"
                        icon={<Pencil className="size-3.5" />}
                        onClick={() => {
                          setCreating(false)
                          setEditingId(rule.id)
                        }}
                      />
                      <IconAction
                        title="Usuń"
                        danger
                        pending={pending}
                        icon={<Trash2 className="size-3.5" />}
                        onClick={() => run(() => deletePriceRule(rule.id))}
                      />
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {!editingId && !creating && error && (
        <div className="px-4 pb-3 sm:px-5">
          <FormError message={error} />
        </div>
      )}

      {creating ? (
        <RuleForm
          initial={EMPTY}
          levels={levels}
          subjects={subjects}
          teachers={teachers}
          pending={pending}
          error={error}
          onCancel={() => setCreating(false)}
          onSubmit={(values) =>
            run(
              () => createPriceRule(values),
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
            Dodaj regułę
          </ActionButton>
        </div>
      )}
    </div>
  )
}
