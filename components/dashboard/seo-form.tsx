"use client"

import { Save } from "lucide-react"
import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import { updateSeoSettings, type SeoInput } from "@/lib/actions/content"

/**
 * Domyślne meta całego serwisu. Podstrony nadpisują je własnymi polami —
 * to jest wartość, którą zobaczy ktoś, kto wejdzie na stronę główną
 * albo na trasę bez własnego opisu.
 */
export function SeoForm({
  initial,
  siteName,
}: {
  initial: SeoInput
  siteName: string
}) {
  const { pending, error, done, run, reset } = useServerAction()
  const [values, setValues] = useState(initial)

  function set<K extends keyof SeoInput>(key: K, value: SeoInput[K]) {
    reset()
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <Field
        label="Tytuł serwisu w wyszukiwarce"
        htmlFor="seoTitle"
        hint={`Puste = „${siteName}". Podstrony dostają dopisek z nazwą serwisu.`}
      >
        <input
          id="seoTitle"
          type="text"
          value={values.seoTitle ?? ""}
          onChange={(e) => set("seoTitle", e.target.value || null)}
          className={inputClass}
        />
      </Field>

      <Field
        label="Opis serwisu"
        htmlFor="seoDescription"
        hint={`${(values.seoDescription ?? "").length} / 160 znaków — dłuższe wyszukiwarka i tak przytnie.`}
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
        label="Domyślny obrazek Open Graph"
        htmlFor="seoOgImage"
        hint="Pokazuje się przy linku wklejonym na czacie albo w mediach społecznościowych."
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

      <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={values.noIndexSite}
          onChange={(e) => set("noIndexSite", e.target.checked)}
          className="mt-0.5 size-3.5 accent-[var(--primary)]"
        />
        <span>
          <span className="font-medium text-foreground">
            Ukryj cały serwis przed wyszukiwarkami
          </span>
          <br />
          Robots dostaje zakaz indeksowania wszystkiego, a mapa witryny się
          opróżnia. Zostawiaj włączone tylko na czas budowy.
        </span>
      </label>

      <FormError message={error} />

      <ActionButton
        pending={pending}
        done={done}
        doneLabel="Zapisano"
        icon={<Save className="size-3.5" />}
        onClick={() => run(() => updateSeoSettings(values))}
      >
        Zapisz ustawienia
      </ActionButton>
    </div>
  )
}
