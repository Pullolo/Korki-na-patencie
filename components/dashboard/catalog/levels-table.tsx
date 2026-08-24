"use client"

import { Check, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { ActionButton, IconAction } from "@/components/dashboard/action-button"
import { FormError, inputClass } from "@/components/dashboard/form-controls"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { useServerAction } from "@/hooks/use-server-action"
import { createLevel, deleteLevel, updateLevel } from "@/lib/actions/catalog"

export type LevelRow = {
  id: string
  name: string
  slug: string
  order: number
  isActive: boolean
}

export function LevelsTable({ levels }: { levels: LevelRow[] }) {
  const { pending, error, run } = useServerAction()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [draftActive, setDraftActive] = useState(true)
  const [newName, setNewName] = useState("")

  function startEdit(level: LevelRow) {
    setEditingId(level.id)
    setDraftName(level.name)
    setDraftActive(level.isActive)
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {levels.map((level, index) => (
          <li key={level.id} className="px-4 py-3 sm:px-5">
            {editingId === level.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className={`${inputClass} max-w-64`}
                />
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draftActive}
                    onChange={(e) => setDraftActive(e.target.checked)}
                    className="size-3.5 accent-[var(--primary)]"
                  />
                  Aktywny
                </label>
                <ActionButton
                  pending={pending}
                  icon={<Check className="size-3.5" />}
                  onClick={() =>
                    run(
                      () =>
                        updateLevel(level.id, {
                          name: draftName,
                          isActive: draftActive,
                          order: level.order,
                        }),
                      () => setEditingId(null)
                    )
                  }
                >
                  Zapisz
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  Anuluj
                </ActionButton>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{level.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {level.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={level.isActive ? "Aktywny" : "Ukryty"}
                    tone={level.isActive ? "green" : "neutral"}
                  />
                  <IconAction
                    title="Przesuń wyżej"
                    icon={<span className="text-xs">↑</span>}
                    pending={pending || index === 0}
                    onClick={() =>
                      run(() =>
                        updateLevel(level.id, {
                          name: level.name,
                          isActive: level.isActive,
                          order: Math.max(0, level.order - 1),
                        })
                      )
                    }
                  />
                  <IconAction
                    title="Edytuj"
                    icon={<Pencil className="size-3.5" />}
                    onClick={() => startEdit(level)}
                  />
                  <IconAction
                    title="Usuń"
                    danger
                    pending={pending}
                    icon={<Trash2 className="size-3.5" />}
                    onClick={() => run(() => deleteLevel(level.id))}
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-border px-4 py-3 sm:px-5">
        <FormError message={error} />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newName}
            placeholder="np. Studia techniczne"
            onChange={(e) => setNewName(e.target.value)}
            className={`${inputClass} max-w-64`}
          />
          <ActionButton
            pending={pending}
            icon={<Plus className="size-3.5" />}
            onClick={() =>
              run(
                () =>
                  createLevel({
                    name: newName,
                    isActive: true,
                    order: levels.length,
                  }),
                () => setNewName("")
              )
            }
          >
            Dodaj poziom
          </ActionButton>
        </div>
      </div>
    </div>
  )
}
