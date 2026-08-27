"use client"

import { ArrowRight, Clock3, MapPin, User } from "lucide-react"
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
import { cardBase } from "@/components/front/styles"
import { useFormAction } from "@/hooks/use-form-action"
import { formatPrice } from "@/lib/format"
import type { RequestBookingResult } from "@/lib/actions/public/booking"
import { requestBooking } from "@/lib/actions/public/booking"
import { cn } from "@/lib/utils"

export type BookingSlotInfo = {
  startsAt: string
  time: string
  dayLabel: string
  minutes: number
  teacherName: string
  teacherSlug: string
  locationName: string | null
  modeLabel: string | null
}

export type LevelOption = {
  id: string
  slug: string
  name: string
  pricePerHour: number | null
  total: number | null
}

/**
 * Krok drugi rezerwacji: dane ucznia.
 *
 * Termin przychodzi z adresu i jest sprawdzany po stronie serwera jeszcze raz
 * przy wysyłce — między wyborem godziny a kliknięciem „wyślij" ktoś mógł ją
 * zająć. Wtedy akcja wraca z listą innych godzin tego dnia, a nie z samym
 * komunikatem o błędzie.
 */
export function BookingForm({
  slot,
  subjectSlug,
  subjectName,
  levels,
  initialLevelSlug,
  currency,
  stamp,
  defaults,
}: {
  slot: BookingSlotInfo
  subjectSlug: string | null
  subjectName: string | null
  levels: LevelOption[]
  initialLevelSlug: string | null
  currency: string
  stamp: string
  defaults: { name: string; email: string; phone: string }
}) {
  const router = useRouter()
  const form = useFormAction<RequestBookingResult>()

  const [startsAt, setStartsAt] = useState(slot.startsAt)
  const [timeLabel, setTimeLabel] = useState(slot.time)
  const [levelSlug, setLevelSlug] = useState(
    initialLevelSlug ?? levels[0]?.slug ?? ""
  )
  const [name, setName] = useState(defaults.name)
  const [phone, setPhone] = useState(defaults.phone)
  const [email, setEmail] = useState(defaults.email)
  const [note, setNote] = useState("")
  const [consent, setConsent] = useState(false)
  const [hp, setHp] = useState("")

  const level = levels.find((item) => item.slug === levelSlug) ?? null
  const alternatives =
    form.result && !form.result.ok ? (form.result.alternatives ?? []) : []

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    form.submit(
      () =>
        requestBooking({
          teacherSlug: slot.teacherSlug,
          // Puste pole znaczy „nie podano" — schemat zamienia je na null.
          subjectSlug: subjectSlug ?? "",
          levelSlug,
          startsAt,
          name,
          phone,
          email,
          note,
          consent,
          hp,
          stamp,
        }),
      (result) => {
        if (result.ok) router.push(`/rezerwacja/${result.kod}`)
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative grid gap-6">
      <Honeypot value={hp} onChange={setHp} />

      <div className={cn(cardBase, "p-5 sm:p-6")}>
        <p className="font-body text-sm font-bold text-front-muted">
          Wybrany termin
        </p>
        <p className="mt-1 font-display text-2xl leading-tight font-semibold">
          {slot.dayLabel}, {timeLabel}
        </p>
        <ul className="mt-3 grid gap-1.5 font-body text-sm text-front-muted">
          <li className="flex items-center gap-2">
            <User className="size-4 shrink-0" />
            {slot.teacherName}
            {subjectName ? ` · ${subjectName}` : ""}
          </li>
          <li className="flex items-center gap-2">
            <Clock3 className="size-4 shrink-0" />
            {slot.minutes} min
          </li>
          {(slot.locationName || slot.modeLabel) && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {[slot.locationName, slot.modeLabel].filter(Boolean).join(" · ")}
            </li>
          )}
        </ul>

        {level?.total !== null && level?.total !== undefined && (
          <p className="mt-4 flex items-baseline justify-between gap-4 border-t border-front-line pt-4">
            <span className="font-body font-semibold text-front-muted">
              Do zapłaty po lekcji
            </span>
            <span className="font-display text-2xl font-semibold">
              {formatPrice(level.total, currency)}
            </span>
          </p>
        )}

        {form.errors.startsAt && (
          <div className="mt-4 border-t border-front-line pt-4">
            <FormError message={form.errors.startsAt} />
            {alternatives.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {alternatives.map((item) => (
                  <button
                    key={item.startsAt}
                    type="button"
                    onClick={() => {
                      setStartsAt(item.startsAt)
                      setTimeLabel(item.time)
                      form.clearError("startsAt")
                    }}
                    className={cn(
                      "min-h-11 rounded-xl px-3.5 font-body text-sm font-bold tabular-nums transition-colors",
                      item.startsAt === startsAt
                        ? "bg-front-ink text-front-surface"
                        : "bg-front-ground text-front-ink hover:bg-front-brand-soft"
                    )}
                  >
                    {item.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {levels.length > 1 && (
        <fieldset>
          <legend className="mb-1.5 font-body text-sm font-bold text-front-ink">
            Poziom
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {levels.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.slug === levelSlug}
                onClick={() => setLevelSlug(item.slug)}
                className={cn(
                  "min-h-11 rounded-full px-4 font-body text-sm font-bold transition-colors duration-150",
                  item.slug === levelSlug
                    ? "bg-front-ink text-front-surface"
                    : "bg-front-ground text-front-muted hover:text-front-ink"
                )}
              >
                {item.name}
                {item.pricePerHour !== null && (
                  <span className="ml-1.5 font-semibold opacity-70">
                    {formatPrice(item.pricePerHour, currency)}/h
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-1.5 font-body text-sm text-front-muted">
            Od poziomu zależy stawka — wybierz ten, na którym uczy się uczeń.
          </p>
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Imię i nazwisko"
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

        <Field
          label="Telefon"
          htmlFor="phone"
          hint="Zadzwonimy tylko w sprawie tego terminu."
          error={form.errors.phone}
        >
          <input
            {...fieldProps(
              "phone",
              form.errors.phone,
              "Zadzwonimy tylko w sprawie tego terminu."
            )}
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
          optional
          hint="Na maila wyślemy potwierdzenie."
          error={form.errors.email}
        >
          <input
            {...fieldProps(
              "email",
              form.errors.email,
              "Na maila wyślemy potwierdzenie."
            )}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              form.clearError("email")
            }}
            className={cn(inputClass, form.errors.email && errorInputClass)}
          />
        </Field>

        <Field
          label="Z czym jest problem"
          htmlFor="note"
          optional
          hint="Dział, sprawdzian, termin matury — cokolwiek pomoże przygotować pierwszą lekcję."
          error={form.errors.note}
          className="sm:col-span-2"
        >
          <textarea
            {...fieldProps("note", form.errors.note)}
            rows={4}
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
          Wyślij zgłoszenie
          <ArrowRight />
        </SubmitButton>
        <p className="font-body text-sm text-front-muted">
          Nic nie płacisz teraz. Potwierdzenie wraca od nauczyciela.
        </p>
      </div>
    </form>
  )
}
