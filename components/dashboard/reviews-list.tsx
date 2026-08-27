"use client"

import { Check, Star, Trash2, Undo2, X } from "lucide-react"
import Link from "next/link"

import { ActionButton, IconAction } from "@/components/dashboard/action-button"
import { FormError } from "@/components/dashboard/form-controls"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { useServerAction } from "@/hooks/use-server-action"
import { deleteReview, setReviewStatus } from "@/lib/actions/reviews"
import { formatDate, formatRelativeTime } from "@/lib/format"
import type { ReviewStatus } from "@/lib/generated/prisma/enums"
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_TONES } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type ReviewRow = {
  id: string
  authorName: string
  rating: number
  content: string
  status: ReviewStatus
  createdAt: Date
  teacherName: string | null
  subjectName: string | null
  bookingId: string | null
  bookingReference: string | null
  lessonDate: Date | null
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-500"
      title={`Ocena ${rating} na 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "size-3.5",
            index < rating ? "fill-current" : "text-muted-foreground/30"
          )}
        />
      ))}
    </span>
  )
}

export function ReviewsList({ reviews }: { reviews: ReviewRow[] }) {
  const { pending, error, run } = useServerAction()

  return (
    <div>
      <ul className="divide-y divide-border">
        {reviews.map((review) => (
          <li key={review.id} className="px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {review.authorName}
                  </p>
                  <Stars rating={review.rating} />
                  <StatusBadge
                    label={REVIEW_STATUS_LABELS[review.status]}
                    tone={REVIEW_STATUS_TONES[review.status]}
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[
                    review.teacherName,
                    review.subjectName,
                    review.lessonDate
                      ? `lekcja ${formatDate(review.lessonDate)}`
                      : "wpis ręczny",
                  ]
                    .filter(Boolean)
                    .join(" · ")}{" "}
                  · {formatRelativeTime(review.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {review.status !== "APPROVED" && (
                  <ActionButton
                    variant="success"
                    pending={pending}
                    icon={<Check className="size-3.5" />}
                    onClick={() => run(() => setReviewStatus(review.id, "APPROVED"))}
                  >
                    Publikuj
                  </ActionButton>
                )}
                {review.status !== "REJECTED" && (
                  <ActionButton
                    variant="ghost"
                    pending={pending}
                    icon={<X className="size-3.5" />}
                    onClick={() => run(() => setReviewStatus(review.id, "REJECTED"))}
                  >
                    Odrzuć
                  </ActionButton>
                )}
                {review.status !== "PENDING" && (
                  <IconAction
                    title="Cofnij do moderacji"
                    pending={pending}
                    icon={<Undo2 className="size-3.5" />}
                    onClick={() => run(() => setReviewStatus(review.id, "PENDING"))}
                  />
                )}
                <IconAction
                  title="Usuń"
                  danger
                  pending={pending}
                  icon={<Trash2 className="size-3.5" />}
                  onClick={() => run(() => deleteReview(review.id))}
                />
              </div>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {review.content}
            </p>

            {review.bookingId && (
              <Link
                href={`/dashboard/rezerwacje/${review.bookingId}`}
                className="mt-2 inline-block text-xs text-muted-foreground underline hover:text-foreground"
              >
                {review.bookingReference}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <div className="px-4 pb-3 sm:px-5">
          <FormError message={error} />
        </div>
      )}
    </div>
  )
}
