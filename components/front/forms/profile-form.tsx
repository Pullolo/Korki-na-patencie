"use client"

import { CircleCheck, Save } from "lucide-react"
import { useState } from "react"

import { SubmitButton } from "@/components/front/forms/consent"
import {
  errorInputClass,
  Field,
  fieldProps,
  FormError,
  inputClass,
} from "@/components/front/forms/field"
import { useFormAction } from "@/hooks/use-form-action"
import type { UpdateOwnProfileResult } from "@/lib/actions/public/profile"
import { updateOwnProfile } from "@/lib/actions/public/profile"
import { cn } from "@/lib/utils"

export type ProfileValues = {
  firstName: string
  lastName: string
  phone: string
  levelId: string
  schoolName: string
  schoolClass: string
  guardianName: string
  guardianPhone: string
}

/**
 * Dane kontaktowe ucznia. E-mail jest tylko do odczytu — należy do konta
 * w Clerku i zmienia się przez nie, a nie przez nasz formularz.
 */
export function ProfileForm({
  initial,
  email,
  levels,
}: {
  initial: ProfileValues
  email: string
  levels: { id: string; name: string }[]
}) {
  const form = useFormAction<UpdateOwnProfileResult>()
  const [values, setValues] = useState(initial)

  function set<K extends keyof ProfileValues>(
    key: K,
    value: ProfileValues[K]
  ) {
    form.clearError(key)
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.submit(() => updateOwnProfile(values))
      }}
      className="grid gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Imię" htmlFor="firstName" error={form.errors.firstName}>
          <input
            {...fieldProps("firstName", form.errors.firstName)}
            type="text"
            autoComplete="given-name"
            required
            value={values.firstName}
            onChange={(event) => set("firstName", event.target.value)}
            className={cn(inputClass, form.errors.firstName && errorInputClass)}
          />
        </Field>

        <Field
          label="Nazwisko"
          htmlFor="lastName"
          optional
          error={form.errors.lastName}
        >
          <input
            {...fieldProps("lastName", form.errors.lastName)}
            type="text"
            autoComplete="family-name"
            value={values.lastName}
            onChange={(event) => set("lastName", event.target.value)}
            className={cn(inputClass, form.errors.lastName && errorInputClass)}
          />
        </Field>

        <Field
          label="Telefon"
          htmlFor="phone"
          optional
          hint="Dzwonimy tylko w sprawie umówionych lekcji."
          error={form.errors.phone}
        >
          <input
            {...fieldProps("phone", form.errors.phone)}
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
            className={cn(inputClass, form.errors.phone && errorInputClass)}
          />
        </Field>

        <Field
          label="E-mail"
          htmlFor="email"
          hint="Adres zmienisz w ustawieniach konta."
        >
          <input
            id="email"
            type="email"
            value={email}
            readOnly
            disabled
            className={cn(inputClass, "opacity-60")}
          />
        </Field>

        <Field label="Poziom nauki" htmlFor="levelId" optional>
          <select
            {...fieldProps("levelId")}
            value={values.levelId}
            onChange={(event) => set("levelId", event.target.value)}
            className={inputClass}
          >
            <option value="">— nie podano —</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Klasa"
          htmlFor="schoolClass"
          optional
          error={form.errors.schoolClass}
        >
          <input
            {...fieldProps("schoolClass", form.errors.schoolClass)}
            type="text"
            value={values.schoolClass}
            onChange={(event) => set("schoolClass", event.target.value)}
            className={cn(
              inputClass,
              form.errors.schoolClass && errorInputClass
            )}
          />
        </Field>

        <Field
          label="Szkoła"
          htmlFor="schoolName"
          optional
          error={form.errors.schoolName}
          className="sm:col-span-2"
        >
          <input
            {...fieldProps("schoolName", form.errors.schoolName)}
            type="text"
            value={values.schoolName}
            onChange={(event) => set("schoolName", event.target.value)}
            className={cn(inputClass, form.errors.schoolName && errorInputClass)}
          />
        </Field>

        <Field
          label="Opiekun"
          htmlFor="guardianName"
          optional
          hint="Wypełnij, jeśli lekcje umawia rodzic."
          error={form.errors.guardianName}
        >
          <input
            {...fieldProps("guardianName", form.errors.guardianName)}
            type="text"
            value={values.guardianName}
            onChange={(event) => set("guardianName", event.target.value)}
            className={cn(
              inputClass,
              form.errors.guardianName && errorInputClass
            )}
          />
        </Field>

        <Field
          label="Telefon opiekuna"
          htmlFor="guardianPhone"
          optional
          error={form.errors.guardianPhone}
        >
          <input
            {...fieldProps("guardianPhone", form.errors.guardianPhone)}
            type="tel"
            value={values.guardianPhone}
            onChange={(event) => set("guardianPhone", event.target.value)}
            className={cn(
              inputClass,
              form.errors.guardianPhone && errorInputClass
            )}
          />
        </Field>
      </div>

      <FormError message={form.formError} />

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={form.pending}>
          <Save />
          Zapisz dane
        </SubmitButton>
        {form.result?.ok && (
          <p className="flex items-center gap-2 font-semibold text-front-mint">
            <CircleCheck className="size-5" />
            Zapisano
          </p>
        )}
      </div>
    </form>
  )
}
