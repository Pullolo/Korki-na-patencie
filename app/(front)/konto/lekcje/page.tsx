import type { Metadata } from "next"
import Link from "next/link"

import type { AccountLesson } from "@/components/front/account/lesson-card"
import { LessonCard } from "@/components/front/account/lesson-card"
import { ReviewForm } from "@/components/front/forms/review-form"
import { btnSecondary, cardBase } from "@/components/front/styles"
import { ensureAccountPage } from "@/lib/auth"
import { formatLongDate, personName } from "@/lib/format"
import { getMyBookings } from "@/lib/public/account"
import { getSiteSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Historia lekcji" }

export default async function AccountLessonsPage() {
  const ctx = await ensureAccountPage()
  const [settings, bookings] = await Promise.all([
    getSiteSettings(),
    getMyBookings(ctx.userId),
  ])

  if (bookings.length === 0) {
    return (
      <div className={cn(cardBase, "p-8 text-center")}>
        <h2 className="font-display text-2xl font-semibold">
          Historia jest jeszcze pusta
        </h2>
        <p className="mx-auto mt-2 max-w-[46ch] leading-relaxed text-front-muted">
          Pojawi się tu każda lekcja umówiona na to konto — także ta wpisana
          przez nauczyciela po rozmowie telefonicznej.
        </p>
        <Link href="/terminy" className={cn(btnSecondary, "mt-6")}>
          Zobacz wolne terminy
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      {bookings.map((booking) => {
        const lesson: AccountLesson = {
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
          price: booking.price,
          mode: booking.mode,
          teacherName: personName(booking.teacherProfile.user),
          teacherSlug: booking.teacherProfile.slug,
          subjectName: booking.subject?.name ?? null,
          levelName: booking.level?.name ?? null,
          locationName: booking.location?.name ?? null,
          locationCity: booking.location?.city ?? null,
          statusReason: booking.statusReason,
        }

        // Opinię wystawia się do odbytej lekcji i tylko raz.
        const canReview = booking.status === "COMPLETED" && !booking.review

        return (
          <LessonCard
            key={booking.id}
            lesson={lesson}
            currency={settings.currency}
          >
            {canReview ? (
              <ReviewForm
                bookingId={booking.id}
                defaultName={ctx.firstName ?? ctx.fullName}
                lessonLabel={`Opinia o lekcji z ${formatLongDate(booking.startsAt)}`}
              />
            ) : booking.review ? (
              <p className="font-body text-sm text-front-muted">
                {booking.review.status === "APPROVED"
                  ? "Twoja opinia jest opublikowana. Dzięki!"
                  : booking.review.status === "PENDING"
                    ? "Opinia czeka na przeczytanie."
                    : "Ta opinia nie została opublikowana."}
              </p>
            ) : null}
          </LessonCard>
        )
      })}
    </div>
  )
}
