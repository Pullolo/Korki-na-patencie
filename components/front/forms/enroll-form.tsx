"use client"

import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  Consent,
  Honeypot,
  SubmitButton,
} from "@/components/front/forms/consent"
import {
  errorInputClass,
  Field,
  fieldProps,
  FormError,
  inputClass,
  textareaClass,
} from "@/components/front/forms/field"
import { useFormAction } from "@/hooks/use-form-action"
import type { EnrollPublicResult } from "@/lib/actions/public/enrollment"
import { enrollPublic } from "@/lib/actions/public/enrollment"
import { cn } from "@/lib/utils"

/**
 * Zapis do grupy. Komplet miejsc nie blokuje formularza — wtedy zgłoszenie
 * wchodzi na listę rezerwową, a przycisk mówi o tym wprost.
 */
export function EnrollForm({
  groupSlug,
  full,
  stamp,
  defaults,
}: {
  groupSlug: string
  full: boolean
  stamp: string
  defaults: { name: string; email: string; phone: string }
}) {
  const router = useRouter()
  const form = useFormAction<EnrollPublicResult>()

  const [name, setName] = useState(defaults.name)
  const [email, setEmail] = useState(defaults.email)
  const [phone, setPhone] = useState(defaults.phone)
  const [note, setNote] = useState("")
  const [consent, setConsent] = useState(false)
  const [hp, setHp] = useState("")

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.submit(
          () =>
            enrollPublic({
              groupSlug,
              name,
              email,
              phone,
              note,
              consent,
              hp,
              stamp,
            }),
          (result) => {
            if (result.ok) router.push(`/zapis/${result.kod}`)
          }
        )
      }}
      className="relative grid gap-5"
    >
      <Honeypot value={hp} onChange={setHp} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Imię i nazwisko ucznia"
          htmlFor="name"
          error={form.errors.name}
          className="sm:col-span-2"
        >
          <input
            {...fieldProps("name", form.errors.name)}
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              form.clearError("name")
            }}
            className={cn(inputClass, form.errors.name && errorInputClass)}
          />
        </Field>

        <Field label="Telefon" htmlFor="phone" error={form.errors.phone}>
          <input
            {...fieldProps("phone", form.errors.phone)}
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              form.clearError("phone")
            }}
            className={cn(inputClass, form.errors.phone && errorInputClass)}
          />
        </Field>

        <Field
          label="E-mail"
          htmlFor="email"
          hint="Tu wyślemy potwierdzenie i szczegóły pierwszego spotkania."
          error={form.errors.email}
        >
          <input
            {...fieldProps(
              "email",
              form.errors.email,
              "Tu wyślemy potwierdzenie i szczegóły pierwszego spotkania."
            )}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              form.clearError("email")
            }}
            className={cn(inputClass, form.errors.email && errorInputClass)}
          />
        </Field>

        <Field
          label="Chcesz coś dodać?"
          htmlFor="note"
          optional
          error={form.errors.note}
          className="sm:col-span-2"
        >
          <textarea
            {...fieldProps("note", form.errors.note)}
            rows={3}
            value={note}
            onChange={(event) => {
              setNote(event.target.value)
              form.clearError("note")
            }}
            className={cn(textareaClass, form.errors.note && errorInputClass)}
          />
        </Field>
      </div>

      <Consent
        checked={consent}
        onChange={(value) => {
          setConsent(value)
          form.clearError("consent")
        }}
        error={form.errors.consent}
      />

      <FormError message={form.formError} />

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={form.pending}>
          {full ? "Zapisz na listę rezerwową" : "Zapisz się do grupy"}
          <ArrowRight />
        </SubmitButton>
        <p className="font-body text-sm text-front-muted">
          {full
            ? "Odezwiemy się, gdy zwolni się miejsce."
            : "Nic nie płacisz teraz — rozliczamy się miesięcznie."}
        </p>
      </div>
    </form>
  )
}
