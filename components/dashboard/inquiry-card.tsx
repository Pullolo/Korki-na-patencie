"use client"

import { Mail, Phone, Trash2 } from "lucide-react"

import { ActionButton, IconAction } from "@/components/dashboard/action-button"
import { FormError, inputClass } from "@/components/dashboard/form-controls"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { useServerAction } from "@/hooks/use-server-action"
import {
  assignInquiry,
  deleteInquiry,
  setInquiryStatus,
} from "@/lib/actions/inquiries"
import { InquiryStatus } from "@/lib/generated/prisma/enums"
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUS_TONES } from "@/lib/labels"

export type InquiryCardData = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  preferredTerm: string | null
  status: InquiryStatus
  createdLabel: string
  handledLabel: string | null
  subjectName: string | null
  levelName: string | null
  teacherProfileId: string | null
  teacherName: string | null
}

export function InquiryCard({
  inquiry,
  isAdmin,
  teachers,
}: {
  inquiry: InquiryCardData
  isAdmin: boolean
  teachers: Array<{ id: string; name: string }>
}) {
  const { pending, error, run } = useServerAction()

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{inquiry.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <a
              href={`mailto:${inquiry.email}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Mail className="size-3" />
              {inquiry.email}
            </a>
            {inquiry.phone && (
              <a
                href={`tel:${inquiry.phone}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Phone className="size-3" />
                {inquiry.phone}
              </a>
            )}
            <span>{inquiry.createdLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge
            label={INQUIRY_STATUS_LABELS[inquiry.status]}
            tone={INQUIRY_STATUS_TONES[inquiry.status]}
          />
          {isAdmin && (
            <IconAction
              title="Usuń zapytanie"
              danger
              pending={pending}
              icon={<Trash2 className="size-3.5" />}
              onClick={() => run(() => deleteInquiry(inquiry.id))}
            />
          )}
        </div>
      </div>

      <p className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
        {inquiry.message}
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Przedmiot: {inquiry.subjectName ?? "—"}</span>
        <span>Poziom: {inquiry.levelName ?? "—"}</span>
        {inquiry.preferredTerm && (
          <span>Preferowany termin: {inquiry.preferredTerm}</span>
        )}
        {inquiry.handledLabel && <span>Obsłużone: {inquiry.handledLabel}</span>}
      </div>

      <FormError message={error} />

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {isAdmin && (
          <select
            value={inquiry.teacherProfileId ?? ""}
            disabled={pending}
            onChange={(event) =>
              run(() => assignInquiry(inquiry.id, event.target.value || null))
            }
            className={`${inputClass} w-auto max-w-48 text-xs`}
            aria-label="Przypisz nauczyciela"
          >
            <option value="">bez przypisania</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        )}

        {!isAdmin && inquiry.teacherName && (
          <span className="text-xs text-muted-foreground">
            Przypisane do: {inquiry.teacherName}
          </span>
        )}

        <div className="ml-auto flex gap-1.5">
          {Object.values(InquiryStatus)
            .filter((status) => status !== inquiry.status)
            .map((status) => (
              <ActionButton
                key={status}
                variant={status === "CLOSED" ? "ghost" : "primary"}
                pending={pending}
                onClick={() => run(() => setInquiryStatus(inquiry.id, status))}
              >
                {status === "NEW"
                  ? "Cofnij do nowych"
                  : status === "IN_PROGRESS"
                    ? "Wziąłem się za to"
                    : "Zamknij"}
              </ActionButton>
            ))}
        </div>
      </div>
    </div>
  )
}
