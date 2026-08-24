import { MessageSquareText } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/dashboard/header"
import { InquiryCard } from "@/components/dashboard/inquiry-card"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { ensureDashboardPage } from "@/lib/auth"
import { formatDateTime, formatRelativeTime } from "@/lib/format"
import { InquiryStatus } from "@/lib/generated/prisma/enums"
import { INQUIRY_STATUS_LABELS } from "@/lib/labels"
import { getTeacherOptions } from "@/lib/queries/availability"
import { getInquiries, getInquiryCounts } from "@/lib/queries/inquiries"

export const metadata: Metadata = { title: "Zapytania" }

const FILTERS = [
  { value: undefined, label: "Wszystkie" },
  ...Object.values(InquiryStatus).map((status) => ({
    value: status,
    label: INQUIRY_STATUS_LABELS[status],
  })),
]

function parseStatus(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined
  return value in InquiryStatus ? (value as InquiryStatus) : undefined
}

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>
}) {
  const ctx = await ensureDashboardPage()
  const status = parseStatus((await searchParams).status)

  const [inquiries, counts, teacherOptions] = await Promise.all([
    getInquiries(ctx, status).catch(() => []),
    getInquiryCounts(ctx).catch(
      () => ({}) as Partial<Record<InquiryStatus, number>>
    ),
    ctx.isAdmin ? getTeacherOptions().catch(() => []) : Promise.resolve([]),
  ])

  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0)

  const teachers = teacherOptions.map((teacher) => ({
    id: teacher.id,
    name:
      [teacher.user.firstName, teacher.user.lastName]
        .filter(Boolean)
        .join(" ") || teacher.user.email,
  }))

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Zapytania"
        subtitle={
          ctx.isAdmin
            ? "Wiadomości z formularza kontaktowego"
            : "Zapytania skierowane do Ciebie"
        }
      />

      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => {
            const isActive = status === filter.value
            const count = filter.value ? (counts[filter.value] ?? 0) : total
            return (
              <Link
                key={filter.label}
                href={
                  filter.value
                    ? `/dashboard/zapytania?status=${filter.value}`
                    : "/dashboard/zapytania"
                }
                className={
                  isActive
                    ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                }
              >
                {filter.label}
                <span className="ml-1.5 opacity-60">{count}</span>
              </Link>
            )
          })}
        </div>

        {inquiries.length === 0 ? (
          <Panel bodyClassName="p-0 sm:p-0">
            <EmptyState
              icon={<MessageSquareText className="size-6" />}
              title="Brak zapytań"
              description="Formularz kontaktowy powstanie razem z frontendem — wtedy wiadomości zaczną tu spływać."
            />
          </Panel>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <InquiryCard
                key={inquiry.id}
                isAdmin={ctx.isAdmin}
                teachers={teachers}
                inquiry={{
                  id: inquiry.id,
                  name: inquiry.name,
                  email: inquiry.email,
                  phone: inquiry.phone,
                  message: inquiry.message,
                  preferredTerm: inquiry.preferredTerm,
                  status: inquiry.status,
                  createdLabel: formatRelativeTime(inquiry.createdAt),
                  handledLabel: inquiry.handledAt
                    ? formatDateTime(inquiry.handledAt)
                    : null,
                  subjectName: inquiry.subject?.name ?? null,
                  levelName: inquiry.level?.name ?? null,
                  teacherProfileId: inquiry.teacherProfileId,
                  teacherName: inquiry.teacherProfile
                    ? [
                        inquiry.teacherProfile.user.firstName,
                        inquiry.teacherProfile.user.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")
                    : null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
