import { CalendarCheck, Gauge, Users2, Wallet } from "lucide-react"
import type { Metadata } from "next"

import { DashboardBarChart } from "@/components/dashboard/bar-chart"
import { DistributionBars } from "@/components/dashboard/distribution-bars"
import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { StatCard } from "@/components/dashboard/stat-card"
import { ensureDashboardPage } from "@/lib/auth"
import { formatPrice, plural } from "@/lib/format"
import { LOCATION_TYPE_LABELS } from "@/lib/labels"
import type { LocationType } from "@/lib/generated/prisma/enums"
import { getStatistics } from "@/lib/queries/statistics"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Statystyki" }

const EMPTY = {
  byMonth: [],
  byGroup: [],
  groups: { revenuePerMonth: 0, students: 0, discounted: 0 },
  bySubject: [],
  byLevel: [],
  byMode: [],
  byTeacher: [],
  byStatus: {},
  occupancy: { percent: 0, booked: 0, free: 0, days: 28 },
  totals: { lessons: 0, revenue: 0 },
}

export default async function StatisticsPage() {
  const ctx = await ensureDashboardPage()
  const [stats, settings] = await Promise.all([
    getStatistics(ctx).catch(() => EMPTY),
    getSiteSettingsSafe(),
  ])

  const currency = settings.currency
  const averagePrice =
    stats.totals.lessons === 0
      ? 0
      : Math.round(stats.totals.revenue / stats.totals.lessons)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Statystyki"
        subtitle={
          ctx.isAdmin
            ? "Ostatnie 6 miesięcy, wszyscy nauczyciele"
            : "Ostatnie 6 miesięcy, Twoje lekcje"
        }
      />

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Lekcje w 6 miesięcy"
            value={String(stats.totals.lessons)}
            hint={`Średnio ${formatPrice(averagePrice, currency)} za lekcję`}
            icon={<CalendarCheck className="size-4 text-emerald-500" />}
            iconBg="bg-emerald-500/15"
          />
          <StatCard
            title="Przychód z lekcji"
            value={formatPrice(stats.totals.revenue, currency)}
            hint="Zajęcia indywidualne z 6 miesięcy"
            icon={<Wallet className="size-4 text-violet-500" />}
            iconBg="bg-violet-500/15"
          />
          <StatCard
            title="Abonamenty grupowe"
            value={`${formatPrice(stats.groups.revenuePerMonth, currency)}/mies.`}
            hint={`${stats.groups.students} ${plural(stats.groups.students, "zapisany uczeń", "zapisanych uczniów", "zapisanych uczniów")}${stats.groups.discounted > 0 ? `, w tym ${stats.groups.discounted} z rabatem` : ""}`}
            icon={<Users2 className="size-4 text-amber-500" />}
            iconBg="bg-amber-500/15"
          />
          <StatCard
            title={`Obłożenie na ${stats.occupancy.days} dni`}
            value={`${stats.occupancy.percent}%`}
            hint={`${stats.occupancy.booked} ${plural(stats.occupancy.booked, "zajęty termin", "zajęte terminy", "zajętych terminów")} z ${stats.occupancy.booked + stats.occupancy.free}`}
            icon={<Gauge className="size-4 text-blue-500" />}
            iconBg="bg-blue-500/15"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Lekcje w czasie" description="Ostatnie 6 miesięcy">
            <div className="w-full overflow-hidden">
              <DashboardBarChart
                name="Lekcje"
                data={stats.byMonth.map((month) => ({
                  label: month.label,
                  value: month.lessons,
                }))}
              />
            </div>
          </Panel>

          <Panel title="Przychód w czasie" description="Ostatnie 6 miesięcy">
            <div className="w-full overflow-hidden">
              <DashboardBarChart
                name="Przychód"
                suffix={currency}
                color="var(--chart-2)"
                data={stats.byMonth.map((month) => ({
                  label: month.label,
                  value: month.revenue,
                }))}
              />
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title="Przedmioty" description="Udział w lekcjach">
            <DistributionBars
              emptyDescription="Statystyki pojawią się po pierwszych potwierdzonych lekcjach."
              items={stats.bySubject.map((item) => ({
                label: item.label,
                value: item.count,
                suffix: formatPrice(item.revenue, currency),
                color: item.color ?? undefined,
              }))}
            />
          </Panel>

          <Panel title="Poziomy" description="Kto najczęściej się zapisuje">
            <DistributionBars
              items={stats.byLevel.map((item) => ({
                label: item.label,
                value: item.count,
              }))}
            />
          </Panel>

          <Panel title="Tryb zajęć" description="Online czy stacjonarnie">
            <DistributionBars
              items={stats.byMode.map((item) => ({
                label: LOCATION_TYPE_LABELS[item.label as LocationType],
                value: item.count,
              }))}
            />
          </Panel>
        </div>

        {stats.byGroup.length > 0 && (
          <Panel
            title="Zajęcia grupowe"
            description="Aktywne zapisy i przychód miesięczny"
          >
            <DistributionBars
              items={stats.byGroup.map((item) => ({
                label: item.label,
                value: item.count,
                suffix: `${formatPrice(item.revenue, currency)}/mies.`,
              }))}
            />
          </Panel>
        )}

        {ctx.isAdmin && (
          <Panel
            title="Nauczyciele"
            description="Liczba lekcji i wypracowany przychód"
          >
            <DistributionBars
              emptyDescription="Nikt nie ma jeszcze potwierdzonych lekcji."
              items={stats.byTeacher.map((item) => ({
                label: item.label,
                value: item.count,
                suffix: formatPrice(item.revenue, currency),
              }))}
            />
          </Panel>
        )}
      </div>
    </div>
  )
}
