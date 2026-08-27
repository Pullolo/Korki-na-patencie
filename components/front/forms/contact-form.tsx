"use client"

import { CircleCheck, Send } from "lucide-react"
import Link from "next/link"
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
import { btnSecondary, cardBase } from "@/components/front/styles"
import { useFormAction } from "@/hooks/use-form-action"
import type { SubmitInquiryResult } from "@/lib/actions/public/inquiry"
import { submitInquiry } from "@/lib/actions/public/inquiry"
import { cn } from "@/lib/utils"

/**
 * Formularz zapytania. Odpowiednik rozmowy telefonicznej — zbiera tylko to,
 * czego naprawdę potrzeba, żeby oddzwonić z sensowną propozycją.
 */
export function ContactForm({
  subjects,
  levels,
  teachers,
  initial,
  stamp,
}: {
  subjects: { slug: string; name: string }[]
  levels: { slug: string; name: string }[]
  teachers: { slug: string; name: string }[]
  initial: {
    subjectSlug?: string
    levelSlug?: string
    teacherSlug?: string
  }
  stamp: string
}) {
  const form = useFormAction<SubmitInquiryResult>()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subjectSlug, setSubjectSlug] = useState(initial.subjectSlug ?? "")
  const [levelSlug, setLevelSlug] = useState(initial.levelSlug ?? "")
  const [teacherSlug, setTeacherSlug] = useState(initial.teacherSlug ?? "")
  const [preferredTerm, setPreferredTerm] = useState("")
  const [message, setMessage] = useState("")
  const [consent, setConsent] = useState(false)
  const [hp, setHp] = useState("")

  if (form.result?.ok) {
    return (
      <div className={cn(cardBase, "p-8 text-center")}>
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-front-mint-soft text-front-mint">
          <CircleCheck className="size-6" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold">
          Mamy Twoją wiadomość
        </h2>
        <p className="mx-auto mt-2 max-w-[46ch] leading-relaxed text-front-muted">
          Odpowiadamy tego samego dnia i od razu proponujemy wolny termin.
          Jeśli sprawa jest pilna, zadzwoń — numer masz obok.
        </p>
        <Link href="/terminy" className={cn(btnSecondary, "mt-6")}>
          Zobacz wolne terminy
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.submit(() =>
          submitInquiry({
            name,
            email,
            phone,
            subjectSlug,
            levelSlug,
            teacherSlug,
            message,
            preferredTerm,
            consent,
            hp,
            stamp,
          })
        )
      }}
      className="relative grid gap-5"
    >
      <Honeypot value={hp} onChange={setHp} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Imię i nazwisko" htmlFor="name" error={form.errors.name}>
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

        <Field label="E-mail" htmlFor="email" error={form.errors.email}>
          <input
            {...fieldProps("email", form.errors.email)}
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
          label="Telefon"
          htmlFor="phone"
          optional
          hint="Zadzwonimy, jeśli tak będzie szybciej."
          error={form.errors.phone}
        >
          <input
            {...fieldProps("phone", form.errors.phone, "Zadzwonimy, jeśli tak będzie szybciej.")}
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              form.clearError("phone")
            }}
            className={cn(inputClass, form.errors.phone && errorInputClass)}
          />
        </Field>

        <Field
          label="Kiedy Ci pasuje"
          htmlFor="preferredTerm"
          optional
          hint="Np. wtorki po 17."
          error={form.errors.preferredTerm}
        >
          <input
            {...fieldProps("preferredTerm", form.errors.preferredTerm, "Np. wtorki po 17.")}
            type="text"
            value={preferredTerm}
            onChange={(event) => {
              setPreferredTerm(event.target.value)
              form.clearError("preferredTerm")
            }}
            className={cn(
              inputClass,
              form.errors.preferredTerm && errorInputClass
            )}
          />
        </Field>

        <Field label="Przedmiot" htmlFor="subjectSlug" optional>
          <select
            {...fieldProps("subjectSlug")}
            value={subjectSlug}
            onChange={(event) => setSubjectSlug(event.target.value)}
            className={inputClass}
          >
            <option value="">— wybierz —</option>
            {subjects.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Poziom" htmlFor="levelSlug" optional>
          <select
            {...fieldProps("levelSlug")}
            value={levelSlug}
            onChange={(event) => setLevelSlug(event.target.value)}
            className={inputClass}
          >
            <option value="">— wybierz —</option>
            {levels.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>

        {teachers.length > 1 && (
          <Field
            label="Nauczyciel"
            htmlFor="teacherSlug"
            optional
            hint="Zostaw puste, jeśli nie masz preferencji."
            className="sm:col-span-2"
          >
            <select
              {...fieldProps("teacherSlug")}
              value={teacherSlug}
              onChange={(event) => setTeacherSlug(event.target.value)}
              className={inputClass}
            >
              <option value="">— ktokolwiek —</option>
              {teachers.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field
          label="Z czym jest problem"
          htmlFor="message"
          hint="Dział, klasa, termin sprawdzianu albo matury — im konkretniej, tym lepsza odpowiedź."
          error={form.errors.message}
          className="sm:col-span-2"
        >
          <textarea
            {...fieldProps("message", form.errors.message)}
            rows={5}
            required
            value={message}
            onChange={(event) => {
              setMessage(event.target.value)
              form.clearError("message")
            }}
            className={cn(textareaClass, form.errors.message && errorInputClass)}
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

      <div>
        <SubmitButton pending={form.pending}>
          <Send />
          Wyślij wiadomość
        </SubmitButton>
      </div>
    </form>
  )
}
