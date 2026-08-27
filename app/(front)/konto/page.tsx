import { ArrowRight, CalendarPlus } from "lucide-react"
import Link from "next/link"

import type { AccountLesson } from "@/components/front/account/lesson-card"
import { LessonCard } from "@/components/front/account/lesson-card"
import { btnPrimary, btnSecondary, cardBase } from "@/components/front/styles"
import { ensureAccountPage } from "@/lib/auth"
import { personName, plural } from "@/lib/format"
import { getMyBookings } from "@/lib/public/account"
import { getSiteSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

export default async function AccountPage() {
  const ctx = await ensureAccountPage()
  const [settings, bookings] = await Promise.all([
    getSiteSettings(),
    getMyBookings(ctx.userId),
  ])

  const now = new Date()
  const upcoming = bookings
    .filter(
      (booking) =>
        booking.startsAt >= now &&
        (booking.status === "PENDING" || booking.status === "CONFIRMED")
    )
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())

  const lessons: AccountLesson[] = upcoming.map((booking) => ({
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
  }))

  return (
    <div className="grid gap-6">
      {lessons.length > 0 ? (
        <>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {lessons.length}{" "}
            {plural(
              lessons.length,
              "nadchodząca lekcja",
              "nadchodzące lekcje",
              "nadchodzących lekcji"
            )}
          </h2>
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              currency={settings.currency}
            />
          ))}
        </>
      ) : (
        <div className={cn(cardBase, "p-8 text-center")}>
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-front-brand-soft text-front-brand">
            <CalendarPlus className="size-6" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold">
            Nie masz umówionej lekcji
          </h2>
          <p className="mx-auto mt-2 max-w-[46ch] leading-relaxed text-front-muted">
            Wolne godziny widać na stronie i są prawdziwe — wybierz jedną,
            a resztę załatwimy.
          </p>
          <Link href="/terminy" className={cn(btnPrimary, "mt-6")}>
            Zobacz wolne terminy
            <ArrowRight />
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/terminy" className={btnSecondary}>
          Umów kolejną lekcję
        </Link>
        <Link href="/konto/lekcje" className={btnSecondary}>
          Historia lekcji
        </Link>
      </div>
    </div>
  )
}
