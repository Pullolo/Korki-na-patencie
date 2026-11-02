"use client"

import { ClipboardPlus, Plus } from "lucide-react"
import { useState } from "react"

import { ActionButton } from "@/components/dashboard/action-button"
import {
  EMPTY_STUDENT,
  StudentPicker,
  type StudentValue,
} from "@/components/dashboard/bookings/student-picker"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import { createBooking } from "@/lib/actions/booking-create"
import { formatPrice, plural } from "@/lib/format"
import { LocationType, type PaymentMethod } from "@/lib/generated/prisma/enums"
import { LOCATION_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/labels"
import { lessonPrice, resolveHourlyPrice } from "@/lib/pricing"
import type { BookingFormOptions } from "@/lib/queries/bookings"

/**
 * Lekcja, która już się odbyła, a nigdy nie przeszła przez rezerwację —
 * dokładnie to, co w arkuszu było zwykłym nowym wierszem. Zapisuje ją ta sama
 * akcja co formularz w Rezerwacjach (`createBooking` z `completed`), tylko
 * formularz jest ustawiony pod rozliczenie: od razu pyta o część nauczyciela,
 * sposób płatności i to, czy wypłata już poszła.
 */

type Values = {
  teacherProfileId: string
  student: StudentValue
  subjectId: string
  levelId: string
  mode: LocationType
  date: string
  time: string
  durationMin: number
  /** Puste = weź z cennika. */
  price: string
  /** Puste = policz ze stawki nauczyciela. */
  payout: string
  paymentMethod: PaymentMethod | ""
  paidOut: boolean
  repeatWeeks: number
}

/** Dzisiejsza data z lokalnych składowych — `toISOString()` cofnąłby ją o dzień. */
function todayKey() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
}

/** Ostatni termin serii — na składowych daty, tak samo jak liczy to serwer. */
function lastStart(date: string, time: string, weeks: number) {
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  if (!year || !month || !day || Number.isNaN(hour)) return null
  return new Date(year, month - 1, day + (weeks - 1) * 7, hour, minute || 0)
}

export function AddPastLesson({
  options,
  rates,
  defaultTeacherId,
  currency,
}: {
  options: BookingFormOptions
  /** Stawki godzinowe — do podpowiedzi, ile wyjdzie „Moje". */
  rates: Array<{ id: string; payoutPerHour: number | null }>
  defaultTeacherId?: string | null
  currency: string
}) {
  const { pending, error, run } = useServerAction()
  const [open, setOpen] = useState(false)

  const firstTeacher = defaultTeacherId ?? options.teachers[0]?.id ?? ""
  const [values, setValues] = useState<Values>({
    teacherProfileId: firstTeacher,
    student: EMPTY_STUDENT,
    subjectId: "",
    levelId: "",
    mode: LocationType.ONLINE,
    date: todayKey(),
    time: "17:00",
    durationMin:
      options.teachers.find((teacher) => teacher.id === firstTeacher)
        ?.slotMinutes ?? 60,
    price: "",
    payout: "",
    paymentMethod: "",
    paidOut: false,
    repeatWeeks: 1,
  })

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  if (!open) {
    return (
      <ActionButton
        icon={<Plus className="size-3.5" />}
        onClick={() => setOpen(true)}
        disabled={options.teachers.length === 0}
        title={
          options.teachers.length === 0
            ? "Twoje konto nie ma profilu nauczyciela"
            : "Wpisz lekcję, która się odbyła, a nie było na nią rezerwacji"
        }
      >
        Dodaj odbytą lekcję
      </ActionButton>
    )
  }

  const validDuration = values.durationMin >= 15

  // Podpowiedzi liczymy tą samą regułą co serwer — tylko po to, żeby było
  // widać, co wyjdzie, zanim ktoś kliknie „Zapisz".
  const hourly = resolveHourlyPrice(
    options.priceRules.map((rule) => ({ ...rule, isActive: true })),
    {
      levelId: values.levelId || null,
      subjectId: values.subjectId || null,
      teacherProfileId: values.teacherProfileId || null,
    }
  )
  const suggestedPrice =
    hourly === null || !validDuration
      ? null
      : lessonPrice(hourly, values.durationMin)

  const rate =
    rates.find((item) => item.id === values.teacherProfileId)?.payoutPerHour ??
    null
  const suggestedPayout =
    rate === null || !validDuration
      ? null
      : lessonPrice(rate, values.durationMin)

  const last = lastStart(values.date, values.time, values.repeatWeeks)
  const isFuture = last !== null && last > new Date()
  const hasStudent = Boolean(
    values.student.studentId || values.student.name.trim()
  )

  const blocker = !hasStudent
    ? "Wpisz ucznia."
    : !validDuration
      ? "Lekcja musi trwać co najmniej 15 minut."
      : isFuture
        ? values.repeatWeeks > 1
          ? "Ostatnia lekcja serii wypada w przyszłości — odbyta lekcja musi mieć termin z przeszłości."
          : "Ten termin jest w przyszłości — odbyta lekcja musi mieć termin z przeszłości."
        : null

  function close() {
    setOpen(false)
    setValues((prev) => ({
      ...prev,
      student: EMPTY_STUDENT,
      price: "",
      payout: "",
      paymentMethod: "",
      paidOut: false,
      repeatWeeks: 1,
    }))
  }

  function submit() {
    run(
      () =>
        createBooking({
          teacherProfileId: values.teacherProfileId,
          studentId: values.student.studentId,
          studentName: values.student.name,
          studentPhone: values.student.phone || null,
          studentEmail: values.student.email || null,
          subjectId: values.subjectId || null,
          levelId: values.levelId || null,
          locationId: null,
          mode: values.mode,
          date: values.date,
          time: values.time,
          durationMin: values.durationMin,
          price: values.price.trim() === "" ? null : Number(values.price),
          // Lekcja odbyta nie przechodzi przez potwierdzanie ani kontrolę
          // kolizji — `completed` ustawia status i znosi oba.
          confirmed: true,
          completed: true,
          teacherPayout:
            values.payout.trim() === "" ? null : Number(values.payout),
          paymentMethod: values.paymentMethod || null,
          paidOut: values.paidOut,
          note: null,
          allowOverlap: true,
          repeatWeeks: values.repeatWeeks,
        }),
      close
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <ClipboardPlus className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Odbyta lekcja</h2>
        <span className="text-xs text-muted-foreground">
          bez rezerwacji — wpisana wstecz, od razu rozliczona
        </span>
      </div>

      <StudentPicker
        value={values.student}
        disabled={pending}
        onChange={(student) => set("student", student)}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.teachers.length > 1 && (
          <Field label="Nauczyciel" className="col-span-2">
            <select
              value={values.teacherProfileId}
              disabled={pending}
              onChange={(event) => {
                const id = event.target.value
                setValues((prev) => ({
                  ...prev,
                  teacherProfileId: id,
                  durationMin:
                    options.teachers.find((item) => item.id === id)
                      ?.slotMinutes ?? prev.durationMin,
                }))
              }}
              className={inputClass}
            >
              {options.teachers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Data">
          <input
            type="date"
            value={values.date}
            max={todayKey()}
            disabled={pending}
            onChange={(event) => set("date", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Godzina">
          <input
            type="time"
            step={900}
            value={values.time}
            disabled={pending}
            onChange={(event) => set("time", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Długość" hint="minuty">
          <input
            type="number"
            min={15}
            max={480}
            step={15}
            value={values.durationMin}
            disabled={pending}
            onChange={(event) => set("durationMin", Number(event.target.value))}
            className={inputClass}
          />
        </Field>

        <Field
          label="Cena"
          hint={
            !validDuration
              ? "podaj długość lekcji"
              : suggestedPrice === null
                ? "brak reguły w cenniku"
                : `z cennika: ${formatPrice(suggestedPrice, currency)}`
          }
        >
          <input
            type="number"
            min={0}
            step={10}
            value={values.price}
            placeholder={suggestedPrice === null ? "—" : String(suggestedPrice)}
            disabled={pending}
            onChange={(event) => set("price", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field
          label="Moje"
          hint={
            suggestedPayout === null
              ? "brak stawki nauczyciela"
              : `ze stawki: ${formatPrice(suggestedPayout, currency)}`
          }
        >
          <input
            type="number"
            min={0}
            step={10}
            value={values.payout}
            placeholder={
              suggestedPayout === null ? "—" : String(suggestedPayout)
            }
            disabled={pending}
            onChange={(event) => set("payout", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Przedmiot">
          <select
            value={values.subjectId}
            disabled={pending}
            onChange={(event) => set("subjectId", event.target.value)}
            className={inputClass}
          >
            <option value="">bez wskazania</option>
            {options.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Poziom">
          <select
            value={values.levelId}
            disabled={pending}
            onChange={(event) => set("levelId", event.target.value)}
            className={inputClass}
          >
            <option value="">bez wskazania</option>
            {options.levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tryb">
          <select
            value={values.mode}
            disabled={pending}
            onChange={(event) =>
              set("mode", event.target.value as LocationType)
            }
            className={inputClass}
          >
            {Object.values(LocationType).map((type) => (
              <option key={type} value={type}>
                {LOCATION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Płatność">
          <select
            value={values.paymentMethod}
            disabled={pending}
            onChange={(event) =>
              set("paymentMethod", event.target.value as PaymentMethod | "")
            }
            className={inputClass}
          >
            <option value="">nie wiem</option>
            {(["ONLINE", "CASH"] as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Co tydzień"
          hint={
            values.repeatWeeks > 1
              ? `${values.repeatWeeks} ${plural(values.repeatWeeks, "lekcja", "lekcje", "lekcji")} wstecz`
              : "jedna lekcja"
          }
        >
          <input
            type="number"
            min={1}
            max={52}
            value={values.repeatWeeks}
            disabled={pending}
            onChange={(event) =>
              set("repeatWeeks", Number(event.target.value) || 1)
            }
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.paidOut}
          disabled={pending}
          onChange={(event) => set("paidOut", event.target.checked)}
          className="size-4 accent-primary"
        />
        Część nauczyciela już wypłacona
      </label>

      <FormError message={error} />
      {blocker && !error && (
        <p className="text-xs text-muted-foreground">{blocker}</p>
      )}

      <div className="flex items-center gap-2">
        <ActionButton
          onClick={submit}
          pending={pending}
          disabled={Boolean(blocker)}
        >
          Zapisz
        </ActionButton>
        <ActionButton onClick={close} variant="ghost" disabled={pending}>
          Anuluj
        </ActionButton>
      </div>
    </div>
  )
}
