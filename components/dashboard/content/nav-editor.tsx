"use client"

import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
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
  createNavLink,
  deleteNavLink,
  moveNavLink,
  updateNavLink,
  type NavLinkInput,
} from "@/lib/actions/content"
import type { NavMenu } from "@/lib/generated/prisma/enums"

export type NavRow = {
  id: string
  label: string
  href: string
  menu: NavMenu
  order: number
  isActive: boolean
  parentId: string | null
}

function NavForm({
  initial,
  menu,
  parents,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  initial: NavLinkInput
  menu: NavMenu
  parents: NavRow[]
  pending: boolean
  error: string | null
  onSubmit: (values: NavLinkInput) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)

  function set<K extends keyof NavLinkInput>(key: K, value: NavLinkInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-3 bg-muted/30 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Etykieta">
          <input
            type="text"
            value={values.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="np. Cennik"
            className={inputClass}
          />
        </Field>
        <Field label="Adres" hint="/cennik albo https://…">
          <input
            type="text"
            value={values.href}
            onChange={(e) => set("href", e.target.value)}
            placeholder="/cennik"
            className={inputClass}
          />
        </Field>
        <Field label="Podpozycja">
          <select
            value={values.parentId ?? ""}
            onChange={(e) => set("parentId", e.target.value || null)}
            className={inputClass}
          >
            <option value="">— pozycja główna —</option>
            {parents
              .filter((item) => item.menu === menu)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  w: {item.label}
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
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="size-3.5 accent-[var(--primary)]"
        />
        Widoczna w menu
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

/**
 * Edytor jednego menu (nagłówek albo stopka).
 *
 * Kolejność zmienia się strzałkami, nie przeciąganiem: pozycji jest kilka,
 * a strzałki działają z klawiatury i na telefonie bez dodatkowej biblioteki.
 */
export function NavEditor({ menu, links }: { menu: NavMenu; links: NavRow[] }) {
  const { pending, error, run } = useServerAction()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const roots = links.filter((link) => !link.parentId)
  const childrenOf = (id: string) =>
    links.filter((link) => link.parentId === id)

  function renderRow(link: NavRow, isChild = false) {
    if (editingId === link.id) {
      return (
        <li key={link.id}>
          <NavForm
            initial={link}
            menu={menu}
            parents={roots.filter((item) => item.id !== link.id)}
            pending={pending}
            error={error}
            onCancel={() => setEditingId(null)}
            onSubmit={(values) =>
              run(
                () => updateNavLink(link.id, values),
                () => setEditingId(null)
              )
            }
          />
        </li>
      )
    }

    return (
      <li
        key={link.id}
        className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5"
      >
        <div className={isChild ? "min-w-0 pl-6" : "min-w-0"}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{link.label}</p>
            {!link.isActive && <StatusBadge label="Ukryta" tone="neutral" />}
            {link.href.startsWith("http") && (
              <ExternalLink className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{link.href}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconAction
            title="W górę"
            icon={<ArrowUp className="size-3.5" />}
            pending={pending}
            onClick={() => run(() => moveNavLink(link.id, "up"))}
          />
          <IconAction
            title="W dół"
            icon={<ArrowDown className="size-3.5" />}
            pending={pending}
            onClick={() => run(() => moveNavLink(link.id, "down"))}
          />
          <IconAction
            title="Edytuj"
            icon={<Pencil className="size-3.5" />}
            onClick={() => {
              setCreating(false)
              setEditingId(link.id)
            }}
          />
          <IconAction
            title="Usuń"
            danger
            pending={pending}
            icon={<Trash2 className="size-3.5" />}
            onClick={() => run(() => deleteNavLink(link.id))}
          />
        </div>
      </li>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {roots.flatMap((link) => [
          renderRow(link),
          ...childrenOf(link.id).map((child) => renderRow(child, true)),
        ])}
      </ul>

      {links.length === 0 && !creating && (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground sm:px-5">
          Menu jest puste — strona pokazuje wtedy listę zapasową z kodu.
        </p>
      )}

      {!editingId && !creating && error && (
        <div className="px-4 pb-3 sm:px-5">
          <FormError message={error} />
        </div>
      )}

      {creating ? (
        <NavForm
          initial={{
            label: "",
            href: "/",
            menu,
            parentId: null,
            order: links.length + 1,
            isActive: true,
          }}
          menu={menu}
          parents={roots}
          pending={pending}
          error={error}
          onCancel={() => setCreating(false)}
          onSubmit={(values) =>
            run(
              () => createNavLink(values),
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
            Dodaj pozycję
          </ActionButton>
        </div>
      )}
    </div>
  )
}
