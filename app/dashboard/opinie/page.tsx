import { Star } from "lucide-react"
import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { ReviewsList } from "@/components/dashboard/reviews-list"
import { ensureAdminPage } from "@/lib/auth"
import { personName, plural } from "@/lib/format"
import { getReviews } from "@/lib/queries/reviews"

export const metadata: Metadata = { title: "Opinie" }

export default async function ReviewsPage() {
  await ensureAdminPage()
  const reviews = await getReviews().catch(() => [])

  const rows = reviews.map((review) => ({
    id: review.id,
    authorName: review.authorName,
    rating: review.rating,
    content: review.content,
    status: review.status,
    createdAt: review.createdAt,
    teacherName: review.teacherProfile
      ? personName(review.teacherProfile.user)
      : null,
    subjectName: review.subject?.name ?? null,
    bookingId: review.booking?.id ?? null,
    bookingReference: review.booking?.reference ?? null,
    lessonDate: review.booking?.startsAt ?? null,
  }))

  const pending = rows.filter((review) => review.status === "PENDING")
  const handled = rows.filter((review) => review.status !== "PENDING")

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Opinie"
        subtitle={`${pending.length} ${plural(pending.length, "opinia czeka", "opinie czekają", "opinii czeka")} na decyzję`}
      />

      <div className="grid gap-4 p-4 sm:p-6">
        <Panel
          title="Do moderacji"
          description="Opinie wystawione przez uczniów po odbytych lekcjach. Publikacja pokazuje je na stronie."
          bodyClassName="p-0 sm:p-0"
        >
          {pending.length === 0 ? (
            <EmptyState
              icon={<Star className="size-6" />}
              title="Nic nie czeka"
              description="Uczniowie wystawiają opinie na swoim koncie, po lekcji oznaczonej jako odbyta."
            />
          ) : (
            <ReviewsList reviews={pending} />
          )}
        </Panel>

        {handled.length > 0 && (
          <Panel
            title="Rozpatrzone"
            description="Opublikowane widać na stronie; odrzucone zostają tylko tutaj."
            bodyClassName="p-0 sm:p-0"
          >
            <ReviewsList reviews={handled} />
          </Panel>
        )}
      </div>
    </div>
  )
}
