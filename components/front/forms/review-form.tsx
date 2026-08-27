"use client"

import { CircleCheck, Star } from "lucide-react"
import { useState } from "react"

import { Consent, SubmitButton } from "@/components/front/forms/consent"
import {
  errorInputClass,
  Field,
  fieldProps,
  FormError,
  textareaClass,
} from "@/components/front/forms/field"
import { useFormAction } from "@/hooks/use-form-action"
import type { SubmitReviewResult } from "@/lib/actions/public/review"
import { submitReview } from "@/lib/actions/public/review"
import { cn } from "@/lib/utils"

/**
 * Opinia po odbytej lekcji. Ocena to grupa przycisków radio, nie widget —
 * działa z klawiatury i czytnik ekranu mówi, co jest wybrane.
 */
export function ReviewForm({
  bookingId,
  defaultName,
  lessonLabel,
}: {
  bookingId: string
  defaultName: string
  lessonLabel: string
}) {
  const form = useFormAction<SubmitReviewResult>()
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState("")
  const [authorName, setAuthorName] = useState(defaultName)
  const [consent, setConsent] = useState(false)

  if (form.result?.ok) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-front-mint-soft px-4 py-3 font-semibold text-front-mint">
        <CircleCheck className="mt-0.5 size-5 shrink-0" />
        Dzięki! Opinia czeka na przeczytanie — pokaże się na stronie, gdy ją
        zatwierdzimy.
      </p>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.submit(() =>
          submitReview({ bookingId, rating, content, authorName, consent })
        )
      }}
      className="grid gap-4"
    >
      <p className="font-body text-sm text-front-muted">{lessonLabel}</p>

      <fieldset>
        <legend className="mb-1.5 font-body text-sm font-bold text-front-ink">
          Ocena
        </legend>
        <div role="radiogroup" aria-label="Ocena lekcji" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} na 5`}
              onClick={() => setRating(value)}
              className="flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-front-sun-soft"
            >
              <Star
                className={cn(
                  "size-6",
                  value <= rating
                    ? "fill-current text-front-sun"
                    : "text-front-line-strong"
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <Field
        label="Twoja opinia"
        htmlFor={`content-${bookingId}`}
        hint="Co pomogło, a co można było zrobić lepiej. Publikujemy bez skracania."
        error={form.errors.content}
      >
        <textarea
          {...fieldProps(`content-${bookingId}`, form.errors.content)}
          rows={4}
          required
          value={content}
          onChange={(event) => {
            setContent(event.target.value)
            form.clearError("content")
          }}
          className={cn(textareaClass, form.errors.content && errorInputClass)}
        />
      </Field>

      <Field
        label="Podpis"
        htmlFor={`authorName-${bookingId}`}
        hint="Tak podpiszemy opinię na stronie — możesz zostawić samo imię."
        error={form.errors.authorName}
      >
        <input
          {...fieldProps(`authorName-${bookingId}`, form.errors.authorName)}
          type="text"
          required
          value={authorName}
          onChange={(event) => {
            setAuthorName(event.target.value)
            form.clearError("authorName")
          }}
          className={cn(
            "w-full min-h-12 rounded-xl border-2 border-front-line bg-front-surface px-4 py-2.5 font-body text-base text-front-ink transition-colors hover:border-front-line-strong focus:border-front-brand focus:outline-none",
            form.errors.authorName && errorInputClass
          )}
        />
      </Field>

      <Consent
        id={`consent-${bookingId}`}
        checked={consent}
        onChange={(value) => {
          setConsent(value)
          form.clearError("consent")
        }}
        error={form.errors.consent}
      />

      <FormError message={form.formError} />

      <div>
        <SubmitButton pending={form.pending}>Wyślij opinię</SubmitButton>
      </div>
    </form>
  )
}
