"use client"

import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { Panel } from "@/components/dashboard/panel"
import { useServerAction } from "@/hooks/use-server-action"
import {
  updateSiteSettings,
  type SiteSettingsInput,
} from "@/lib/actions/settings"

export function SiteSettingsForm({ initial }: { initial: SiteSettingsInput }) {
  const { pending, error, done, run, reset } = useServerAction()
  const [values, setValues] = useState(initial)

  function set<K extends keyof SiteSettingsInput>(
    key: K,
    value: SiteSettingsInput[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    reset()
  }

  return (
    <div className="space-y-4">
      <Panel title="Serwis" description="Nazwa widoczna w panelu i na stronie">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nazwa">
            <input
              type="text"
              value={values.siteName}
              onChange={(e) => set("siteName", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Hasło przewodnie">
            <input
              type="text"
              value={values.tagline ?? ""}
              placeholder="np. Korepetycje, na które faktycznie się zapiszesz"
              onChange={(e) => set("tagline", e.target.value || null)}
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Kontakt" description="Dane, które trafią do stopki strony">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="E-mail">
            <input
              type="email"
              value={values.contactEmail ?? ""}
              onChange={(e) => set("contactEmail", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Telefon">
            <input
              type="tel"
              value={values.contactPhone ?? ""}
              onChange={(e) => set("contactPhone", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Adres" className="sm:col-span-2">
            <input
              type="text"
              value={values.contactAddress ?? ""}
              onChange={(e) => set("contactAddress", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Facebook">
            <input
              type="url"
              value={values.socialFacebook ?? ""}
              placeholder="https://facebook.com/..."
              onChange={(e) => set("socialFacebook", e.target.value || null)}
              className={inputClass}
            />
          </Field>
          <Field label="Instagram">
            <input
              type="url"
              value={values.socialInstagram ?? ""}
              placeholder="https://instagram.com/..."
              onChange={(e) => set("socialInstagram", e.target.value || null)}
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Rezerwacje"
        description="Wartości domyślne — każdy nauczyciel może zawęzić je u siebie w sekcji Moja dostępność"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Min. wyprzedzenie" hint="godziny">
            <input
              type="number"
              min={0}
              max={720}
              value={values.bookingMinLeadHours}
              onChange={(e) =>
                set("bookingMinLeadHours", Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Horyzont zapisów" hint="dni">
            <input
              type="number"
              min={1}
              max={365}
              value={values.bookingMaxAdvanceDays}
              onChange={(e) =>
                set("bookingMaxAdvanceDays", Number(e.target.value))
              }
              className={inputClass}
            />
          </Field>
          <Field label="Waluta" hint="kod ISO, np. PLN">
            <input
              type="text"
              maxLength={3}
              value={values.currency}
              onChange={(e) => set("currency", e.target.value.toUpperCase())}
              className={inputClass}
            />
          </Field>
        </div>

        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={values.bookingAutoConfirm}
            onChange={(e) => set("bookingAutoConfirm", e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          <span>
            Automatycznie potwierdzaj rezerwacje
            <span className="block text-xs text-muted-foreground">
              Uczeń dostanie potwierdzenie od razu, bez decyzji nauczyciela.
              Zadziała dopiero po uruchomieniu zapisów na stronie.
            </span>
          </span>
        </label>
      </Panel>

      <FormError message={error} />

      <ActionButton
        pending={pending}
        done={done}
        doneLabel="Zapisano"
        onClick={() => run(() => updateSiteSettings(values))}
      >
        Zapisz ustawienia
      </ActionButton>
    </div>
  )
}
