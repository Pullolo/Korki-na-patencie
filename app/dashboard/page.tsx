import {
  CalendarCheck,
  CalendarClock,
  Clock,
  Users,
  Wallet,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/dashboard/header"
import { DashboardBarChart } from "@/components/dashboard/bar-chart"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ensureDashboardPage } from "@/lib/auth"
import {
  formatLongDate,
  formatPrice,
  formatRelativeTime,
  formatTime,
  studentLabel,
  teacherLabel,
} from "@/lib/format"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import { getDashboardStats, type DashboardStats } from "@/lib/queries/dashboard"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Pulpit" }

const EMPTY_STATS: DashboardStats = {
  lessonsThisMonth: 0,
  lessonsGrowth: 0,
  pendingBookings: 0,
  revenueThisMonth: 0,
  revenueGrowth: 0,
  studentsCount: 0,
  groupRevenuePerMonth: 0,
  chart: [],
  upcoming: [],
  latestPending: [],
}

export default async function DashboardPage() {
  const ctx = await ensureDashboardPage()
  const [stats, settings] = await Promise.all([
    getDashboardStats(ctx).catch(() => EMPTY_STATS),
    getSiteSettingsSafe(),
  ])

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title={`Cześć, ${ctx.fullName.split(" ")[0]}`}
        subtitle={formatLongDate(new Date())}
      />

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Lekcje w tym miesiącu"
            value={String(stats.lessonsThisMonth)}
            change={stats.lessonsGrowth}
            icon={<CalendarCheck className="size-4 text-emerald-500" />}
            iconBg="bg-emerald-500/15"
          />
          <StatCard
            title="Oczekujące rezerwacje"
            value={String(stats.pendingBookings)}
            hint={
              stats.pendingBookings > 0
                ? "Czekają na Twoją decyzję"
                : "Nic nie czeka na decyzję"
            }
            icon={<Clock className="size-4 text-amber-500" />}
            iconBg="bg-amber-500/15"
          />
          <StatCard
            title="Uczniowie"
            value={String(stats.studentsCount)}
            hint="Z co najmniej jedną lekcją"
            icon={<Users className="size-4 text-blue-500" />}
            iconBg="bg-blue-500/15"
          />
          <StatCard
            title="Przychód z lekcji"
            value={formatPrice(stats.revenueThisMonth, settings.currency)}
            change={stats.revenueGrowth}
            changeLabel={
              stats.groupRevenuePerMonth > 0
                ? `+ ${formatPrice(stats.groupRevenuePerMonth, settings.currency)}/mies. z grup`
                : "vs poprzedni miesiąc"
            }
            icon={<Wallet className="size-4 text-violet-500" />}
            iconBg="bg-violet-500/15"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title="Lekcje w czasie"
            description="Ostatnie 6 miesięcy"
            className="lg:col-span-2"
          >
            <div className="w-full overflow-hidden">
              <DashboardBarChart data={stats.chart} name="Lekcje" />
            </div>
          </Panel>

          <Panel
            title="Najbliższe lekcje"
            description="Potwierdzone terminy"
            bodyClassName="p-0 sm:p-0"
          >
            {stats.upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="size-6" />}
                title="Brak zaplanowanych lekcji"
                description="Potwierdzone rezerwacje pojawią się tutaj."
              />
            ) : (
              <ul className="divide-y divide-border">
                {stats.upcoming.map((booking) => (
                  <li key={booking.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">
                        {studentLabel(booking)}
                      </p>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {formatTime(booking.startsAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {booking.subject?.name ?? "Bez przedmiotu"} ·{" "}
                      {LOCATION_TYPE_LABELS[booking.mode]}
                      {ctx.isAdmin &&
                        ` · ${teacherLabel(booking.teacherProfile)}`}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/80">
                      {formatLongDate(booking.startsAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel
          title="Rezerwacje do rozpatrzenia"
          description="Najnowsze zgłoszenia oczekujące na potwierdzenie"
          actions={
            <Link
              href="/dashboard/rezerwacje"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Zobacz wszystkie
            </Link>
          }
          bodyClassName="p-0 sm:p-0"
        >
          {stats.latestPending.length === 0 ? (
            <EmptyState
              icon={<Clock className="size-6" />}
              title="Skrzynka pusta"
              description="Nowe zgłoszenia od uczniów trafią tutaj."
            />
          ) : (
            <ul className="divide-y divide-border">
              {stats.latestPending.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {studentLabel(booking)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {booking.reference}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {booking.subject?.name ?? "Bez przedmiotu"} ·{" "}
                      {formatLongDate(booking.startsAt)},{" "}
                      {formatTime(booking.startsAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {formatRelativeTime(booking.createdAt)}
                    </span>
                    <StatusBadge label="Oczekuje" tone="amber" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
