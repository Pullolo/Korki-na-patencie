"use client"

import { Pencil, Trash2, UserMinus, UserPlus } from "lucide-react"
import { useState } from "react"

import { ActionButton, IconAction } from "@/components/dashboard/action-button"
import { GroupForm, type GroupFormOptions } from "@/components/dashboard/groups/group-form"
import {
  Field,
  FormError,
  inputClass,
} from "@/components/dashboard/form-controls"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { useServerAction } from "@/hooks/use-server-action"
import {
  deleteCourseGroup,
  enrollInGroup,
  removeEnrollment,
  setEnrollmentStatus,
  updateCourseGroup,
  type CourseGroupInput,
} from "@/lib/actions/groups"
import { formatPrice, minutesToTime, plural, WEEKDAYS } from "@/lib/format"
import { groupHourlyEquivalent } from "@/lib/pricing"

export type EnrollmentRowData = {
  id: string
  name: string
  status: "ACTIVE" | "WAITLIST" | "CANCELLED" | "FINISHED"
  monthlyPrice: number
  discountPercent: number
  note: string | null
}

export type GroupCardData = CourseGroupInput & {
  id: string
  teacherName: string
  subjectName: string | null
  levelName: string | null
  locationName: string | null
  enrollments: EnrollmentRowData[]
}

const STATUS_LABELS: Record<EnrollmentRowData["status"], string> = {
  ACTIVE: "Zapisany",
  WAITLIST: "Lista rezerwowa",
  CANCELLED: "Zrezygnował",
  FINISHED: "Zakończył",
}

const STATUS_TONES = {
  ACTIVE: "green",
  WAITLIST: "amber",
  CANCELLED: "neutral",
  FINISHED: "blue",
} as const

export function GroupCard({
  group,
  options,
  students,
  currency,
}: {
  group: GroupCardData
  options: GroupFormOptions
  students: Array<{ id: string; name: string }>
  currency: string
}) {
  const { pending, error, run } = useServerAction()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [guestName, setGuestName] = useState("")

  const active = group.enrollments.filter((item) => item.status === "ACTIVE")
  const weekday = WEEKDAYS.find((day) => day.value === group.weekday)
  const hourly = groupHourlyEquivalent(group)

  if (editing) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <GroupForm
          initial={group}
          options={options}
          pending={pending}
          error={error}
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            run(
              () => updateCourseGroup(group.id, values),
              () => setEditing(false)
            )
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{group.name}</p>
          <p className="text-xs text-muted-foreground">
            {weekday?.label} {minutesToTime(group.startMin)} ·{" "}
            {group.meetingsPerMonth}{" "}
            {plural(
              group.meetingsPerMonth,
              "spotkanie",
              "spotkania",
              "spotkań"
            )}{" "}
            po {group.meetingMinutes} min · {group.teacherName}
          </p>
          <p className="text-xs text-muted-foreground">
            {group.levelName ?? "wszystkie poziomy"} ·{" "}
            {group.subjectName ?? "bez przedmiotu"} ·{" "}
            {group.locationName ?? "bez lokalizacji"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge
            label={group.isPublished ? "Widoczna" : "Szkic"}
            tone={group.isPublished ? "green" : "neutral"}
          />
          {!group.isActive && <StatusBadge label="Wyłączona" tone="red" />}
          <IconAction
            title="Edytuj grupę"
            icon={<Pencil className="size-3.5" />}
            onClick={() => setEditing(true)}
          />
          <IconAction
            title="Usuń grupę"
            danger
            pending={pending}
            icon={<Trash2 className="size-3.5" />}
            onClick={() => run(() => deleteCourseGroup(group.id))}
          />
        </div>
      </div>

      {group.description && (
        <p className="text-sm text-muted-foreground">{group.description}</p>
      )}

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(group.pricePerMonth, currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">miesięcznie</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(hourly, currency)}
          </p>
          <p className="text-[11px] text-muted-foreground">w przeliczeniu / h</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {active.length} / {group.maxSeats}
          </p>
          <p className="text-[11px] text-muted-foreground">
            miejsc zajętych (min. {group.minSeats})
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Zapisani
        </p>
        {group.enrollments.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nikt jeszcze nie dołączył.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {group.enrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{enrollment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(enrollment.monthlyPrice, currency)}/mies.
                    {enrollment.discountPercent > 0 &&
                      ` · rabat ${enrollment.discountPercent}%`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge
                    label={STATUS_LABELS[enrollment.status]}
                    tone={STATUS_TONES[enrollment.status]}
                  />
                  {enrollment.status === "WAITLIST" && (
                    <ActionButton
                      variant="ghost"
                      pending={pending}
                      onClick={() =>
                        run(() => setEnrollmentStatus(enrollment.id, "ACTIVE"))
                      }
                    >
                      Wpuść
                    </ActionButton>
                  )}
                  {enrollment.status === "ACTIVE" && (
                    <ActionButton
                      variant="ghost"
                      pending={pending}
                      onClick={() =>
                        run(() =>
                          setEnrollmentStatus(enrollment.id, "CANCELLED")
                        )
                      }
                    >
                      Rezygnacja
                    </ActionButton>
                  )}
                  <IconAction
                    title="Usuń zapis"
                    danger
                    pending={pending}
                    icon={<UserMinus className="size-3.5" />}
                    onClick={() => run(() => removeEnrollment(enrollment.id))}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormError message={error} />

      {adding ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Uczeń z konta">
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className={inputClass}
              >
                <option value="">— wybierz —</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="albo imię i nazwisko" hint="zapis bez konta">
              <input
                type="text"
                value={guestName}
                disabled={Boolean(studentId)}
                onChange={(e) => setGuestName(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Rabat naliczy się automatycznie, jeśli uczeń ma u nas zajęcia
            indywidualne. Po wyczerpaniu miejsc zapis trafia na listę rezerwową.
          </p>
          <div className="flex gap-2">
            <ActionButton
              pending={pending}
              icon={<UserPlus className="size-3.5" />}
              onClick={() =>
                run(
                  () =>
                    enrollInGroup(group.id, {
                      studentId: studentId || null,
                      guestName: studentId ? null : guestName,
                      guestEmail: null,
                      guestPhone: null,
                      note: null,
                    }),
                  () => {
                    setAdding(false)
                    setStudentId("")
                    setGuestName("")
                  }
                )
              }
            >
              Zapisz do grupy
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => setAdding(false)}>
              Anuluj
            </ActionButton>
          </div>
        </div>
      ) : (
        <ActionButton
          variant="ghost"
          icon={<UserPlus className="size-3.5" />}
          onClick={() => setAdding(true)}
        >
          Dopisz ucznia
        </ActionButton>
      )}
    </div>
  )
}
