"use client"

import { Eye, Pencil, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { Panel } from "@/components/dashboard/panel"
import { MarkdownContent } from "@/components/markdown"
import { useServerAction } from "@/hooks/use-server-action"
import { deletePage, updatePage, type PageInput } from "@/lib/actions/content"
import { cn } from "@/lib/utils"

/**
 * Edytor strony CMS: markdown po lewej, podgląd po prawej.
 *
 * Podgląd renderuje ten sam komponent, co strona publiczna — inaczej admin
 * pisałby w ciemno i dowiadywał się o kształcie treści dopiero po publikacji.
 */
export function PageEditor({
  id,
  initial,
}: {
  id: string
  initial: PageInput
}) {
  const router = useRouter()
  const { pending, error, done, run } = useServerAction()
  const [values, setValues] = useState(initial)
  const [preview, setPreview] = useState(false)

  function set<K extends keyof PageInput>(key: K, value: PageInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <Panel
        title="Treść"
        description="Markdown: ## nagłówek, **pogrubienie**, - lista, [link](/adres)."
        actions={
          <ActionButton
            variant="ghost"
            icon={
              preview ? (
                <Pencil className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )
            }
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? "Edycja" : "Podgląd"}
          </ActionButton>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <Field label="Tytuł" htmlFor="title">
              <input
                id="title"
                type="text"
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Adres"
              htmlFor="slug"
              hint="Zostaw puste, żeby zbudować z tytułu."
            >
              <input
                id="slug"
                type="text"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="regulamin"
                className={inputClass}
              />
            </Field>
          </div>

          {preview ? (
            <div className="min-h-96 rounded-lg border border-border bg-card p-4">
              <MarkdownContent
                tone="panel"
                content={values.content ?? "_Pusta strona._"}
              />
            </div>
          ) : (
            <Field label="Treść" htmlFor="content">
              <textarea
                id="content"
                rows={22}
                value={values.content ?? ""}
                onChange={(e) => set("content", e.target.value)}
                className={cn(inputClass, "font-mono text-xs leading-relaxed")}
              />
            </Field>
          )}
        </div>
      </Panel>

      <div className="grid gap-4">
        <Panel title="Publikacja">
          <div className="space-y-3">
            <Field label="Status" htmlFor="status">
              <select
                id="status"
                value={values.status}
                onChange={(e) =>
                  set("status", e.target.value as PageInput["status"])
                }
                className={inputClass}
              >
                <option value="DRAFT">Szkic — niewidoczna na stronie</option>
                <option value="PUBLISHED">Opublikowana</option>
              </select>
            </Field>

            <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={values.noIndex}
                onChange={(e) => set("noIndex", e.target.checked)}
                className="mt-0.5 size-3.5 accent-[var(--primary)]"
              />
              Ukryj przed wyszukiwarkami (noindex, poza mapą witryny)
            </label>

            <FormError message={error} />

            <div className="flex flex-wrap gap-2">
              <ActionButton
                pending={pending}
                done={done}
                doneLabel="Zapisano"
                icon={<Save className="size-3.5" />}
                onClick={() =>
                  run(async () => {
                    const page = await updatePage(id, values)
                    // Slug mógł się zmienić — link „zobacz na stronie" ma
                    // prowadzić w nowe miejsce, nie w stare.
                    set("slug", page.slug)
                  })
                }
              >
                Zapisz
              </ActionButton>
              <ActionButton
                variant="danger"
                pending={pending}
                icon={<Trash2 className="size-3.5" />}
                onClick={() =>
                  run(async () => {
                    await deletePage(id)
                    router.push("/dashboard/strony")
                  })
                }
              >
                Usuń
              </ActionButton>
            </div>
          </div>
        </Panel>

        <Panel
          title="SEO"
          description="Puste pola dziedziczą tytuł strony i ustawienia serwisu."
        >
          <div className="space-y-3">
            <Field label="Tytuł w wyszukiwarce" htmlFor="seoTitle">
              <input
                id="seoTitle"
                type="text"
                value={values.seoTitle ?? ""}
                onChange={(e) => set("seoTitle", e.target.value || null)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Opis"
              htmlFor="seoDescription"
              hint={`${(values.seoDescription ?? "").length} / 160 znaków`}
            >
              <textarea
                id="seoDescription"
                rows={3}
                value={values.seoDescription ?? ""}
                onChange={(e) => set("seoDescription", e.target.value || null)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Obrazek Open Graph"
              htmlFor="seoOgImage"
              hint="Pełny adres obrazka pokazywanego przy linku."
            >
              <input
                id="seoOgImage"
                type="url"
                value={values.seoOgImage ?? ""}
                onChange={(e) => set("seoOgImage", e.target.value || null)}
                placeholder="https://…"
                className={inputClass}
              />
            </Field>
          </div>
        </Panel>
      </div>
    </div>
  )
}
