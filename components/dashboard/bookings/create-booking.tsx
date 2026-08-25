"use client"

import { CalendarPlus, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { formatPrice } from "@/lib/format"
import { LocationType } from "@/lib/generated/prisma/enums"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import { resolveHourlyPrice } from "@/lib/pricing"
import type { BookingFormOptions } from "@/lib/queries/bookings"
import { cn } from "@/lib/utils"

type Values = {
  teacherProfileId: string
  student: StudentValue
  subjectId: string
  levelId: string
  locationId: string
  mode: LocationType
  date: string
  time: string
  durationMin: number
  /** Puste = weź stawkę z cennika. */
  price: string
  confirmed: boolean
  note: string
}

function todayKey() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
}

export function CreateBooking({
  options,
  defaultTeacherId,
  initialDate,
  initialTime,
  autoOpen,
  closeHref,
  currency,
}: {
  options: BookingFormOptions
  /** Kalendarz zna już nauczyciela, którego grafik oglądamy. */
  defaultTeacherId?: string | null
  initialDate?: string
  initialTime?: string
  /** Wejście z kliknięcia w wolne okienko — formularz otwarty od razu. */
  autoOpen?: boolean
  /** Adres bez parametru `nowa`, żeby zamknięcie posprzątało pasek adresu. */
  closeHref?: string
  currency: string
}) {
  const router = useRouter()
  const { pending, error, run } = useServerAction()
  const [open, setOpen] = useState(Boolean(autoOpen))
  const firstTeacher = defaultTeacherId ?? options.teachers[0]?.id ?? ""

  const [values, setValues] = useState<Values>({
    teacherProfileId: firstTeacher,
    student: EMPTY_STUDENT,
    subjectId: "",
    levelId: "",
    locationId: "",
    mode: LocationType.ONLINE,
    date: initialDate ?? todayKey(),
    time: initialTime ?? "17:00",
    durationMin:
      options.teachers.find((teacher) => teacher.id === firstTeacher)
        ?.slotMinutes ?? 60,
    price: "",
    confirmed: true,
    note: "",
  })
  const [allowOverlap, setAllowOverlap] = useState(false)

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const teacher = options.teachers.find(
    (item) => item.id === values.teacherProfileId
  )

  // Podpowiedź ceny liczymy tą samą regułą co serwer — tu tylko po to,
  // żeby było widać, ile wyjdzie, zanim ktoś kliknie „Zapisz".
  const hourly = resolveHourlyPrice(
    options.priceRules.map((rule) => ({ ...rule, isActive: true })),
    {
      levelId: values.levelId || null,
      subjectId: values.subjectId || null,
      teacherProfileId: values.teacherProfileId || null,
    }
  )
  // Puste pole długości daje `Number("") === 0` — wtedy nie ma czego liczyć
  // ani pokazywać, a i tak nie przepuści tego walidacja na serwerze.
  const validDuration = values.durationMin >= 15
  const suggested =
    hourly === null || !validDuration
      ? null
      : Math.round((hourly * values.durationMin) / 60)

  if (!open) {
    return (
      <ActionButton
        icon={<Plus className="size-3.5" />}
        onClick={() => setOpen(true)}
        disabled={options.teachers.length === 0}
        title={
          options.teachers.length === 0
            ? "Twoje konto nie ma profilu nauczyciela"
            : undefined
        }
      >
        Dodaj lekcję
      </ActionButton>
    )
  }

  function close() {
    setOpen(false)
    setValues((prev) => ({ ...prev, student: EMPTY_STUDENT, note: "" }))
    setAllowOverlap(false)
    if (closeHref) router.replace(closeHref)
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
          locationId: values.locationId || null,
          mode: values.mode,
          date: values.date,
          time: values.time,
          durationMin: values.durationMin,
          price: values.price.trim() === "" ? null : Number(values.price),
          confirmed: values.confirmed,
          note: values.note || null,
          allowOverlap,
        }),
      close
    )
  }

  const hasConflict = Boolean(error?.startsWith("Termin koliduje"))

  const endTime = (() => {
    const [hour, minute] = values.time.split(":").map(Number)
    const end = new Date(2000, 0, 1, hour, minute + values.durationMin)
    return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
  })()

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <CalendarPlus className="size-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Nowa lekcja</h2>
        <span className="text-xs text-muted-foreground">
          ustalona poza serwisem — np. przez telefon
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
              onChange={(event) => {
                const id = event.target.value
                setValues((prev) => ({
                  ...prev,
                  teacherProfileId: id,
                  // Lokalizacje należą do nauczyciela, więc wybór przestaje pasować.
                  locationId: "",
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
            onChange={(event) => set("date", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Godzina">
          <input
            type="time"
            step={900}
            value={values.time}
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
            onChange={(event) => set("durationMin", Number(event.target.value))}
            className={inputClass}
          />
        </Field>
        <Field
          label="Cena"
          hint={
            !validDuration
              ? "podaj długość lekcji"
              : suggested === null
                ? "brak reguły w cenniku"
                : `z cennika: ${formatPrice(suggested, currency)}`
          }
        >
          <input
            type="number"
            min={0}
            step={10}
            value={values.price}
            placeholder={suggested === null ? "—" : String(suggested)}
            onChange={(event) => set("price", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Przedmiot">
          <select
            value={values.subjectId}
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
        <Field label="Miejsce">
          <select
            value={values.locationId}
            onChange={(event) => {
              const id = event.target.value
              const location = teacher?.locations.find((item) => item.id === id)
              setValues((prev) => ({
                ...prev,
                locationId: id,
                // Tryb wynika z miejsca — nie ma sensu pytać o to dwa razy.
                mode: location ? location.type : prev.mode,
              }))
            }}
            className={inputClass}
          >
            <option value="">bez wskazania</option>
            {teacher?.locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notatka" hint="widoczna tylko w panelu">
        <input
          type="text"
          value={values.note}
          placeholder="np. ustalone telefonicznie z mamą"
          onChange={(event) => set("note", event.target.value)}
          className={inputClass}
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={values.confirmed}
          onChange={(event) => set("confirmed", event.target.checked)}
          className="size-3.5 cursor-pointer accent-primary"
        />
        Od razu potwierdzona — termin jest już ustalony, nie czeka na akceptację
      </label>

      {hasConflict && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-destructive">
          <input
            type="checkbox"
            checked={allowOverlap}
            onChange={(event) => setAllowOverlap(event.target.checked)}
            className="size-3.5 cursor-pointer accent-destructive"
          />
          Zapisz mimo kolizji — wiem, że termin się nakłada
        </label>
      )}

      <FormError message={error} />

      <div className="flex items-center gap-2">
        <ActionButton onClick={submit} pending={pending}>
          Zapisz lekcję
        </ActionButton>
        <ActionButton variant="ghost" onClick={close} disabled={pending}>
          Anuluj
        </ActionButton>
        {validDuration && (
          <span
            className={cn(
              "text-xs text-muted-foreground",
              pending && "opacity-50"
            )}
          >
            {values.time}–{endTime}
          </span>
        )}
      </div>
    </div>
  )
}
