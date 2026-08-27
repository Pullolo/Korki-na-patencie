import { Eye, MousePointerClick, Users } from "lucide-react"
import type { Metadata } from "next"

import { DashboardBarChart } from "@/components/dashboard/bar-chart"
import { DistributionBars } from "@/components/dashboard/distribution-bars"
import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { StatCard } from "@/components/dashboard/stat-card"
import { ensureAdminPage } from "@/lib/auth"
import { formatNumber } from "@/lib/format"
import { getTrafficSummary } from "@/lib/queries/traffic"

export const metadata: Metadata = { title: "Ruch na stronie" }

const RANGE_DAYS = 30

export default async function TrafficPage() {
  await ensureAdminPage()

  const traffic = await getTrafficSummary(RANGE_DAYS).catch(() => null)

  if (!traffic) {
    return (
      <div className="flex w-full min-w-0 flex-col">
        <Header title="Ruch na stronie" subtitle="Odsłony i źródła wejść" />
        <div className="p-4 sm:p-6">
          <Panel>
            <p className="text-sm text-muted-foreground">
              Nie udało się odczytać danych o ruchu.
            </p>
          </Panel>
        </div>
      </div>
    )
  }

  // Zmiana wobec poprzedniego okresu tej samej długości.
  const change =
    traffic.previousViews > 0
      ? Math.round(
          ((traffic.totalViews - traffic.previousViews) /
            traffic.previousViews) *
            100
        )
      : undefined

  const perSession =
    traffic.sessions > 0
      ? (traffic.totalViews / traffic.sessions).toFixed(1).replace(".", ",")
      : "—"

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Ruch na stronie"
        subtitle={`Ostatnie ${RANGE_DAYS} dni · dane z własnej tabeli odsłon, bez zewnętrznej analityki`}
      />

      <div className="grid gap-4 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Odsłony"
            value={formatNumber(traffic.totalViews)}
            change={change}
            changeLabel={`vs poprzednie ${RANGE_DAYS} dni`}
            icon={<Eye className="size-4" />}
          />
          <StatCard
            title="Sesje"
            value={formatNumber(traffic.sessions)}
            hint="Identyfikator sesji ginie po zamknięciu karty."
            icon={<Users className="size-4" />}
          />
          <StatCard
            title="Odsłon na sesję"
            value={perSession}
            hint="Ile stron ogląda jedna osoba podczas wizyty."
            icon={<MousePointerClick className="size-4" />}
          />
        </div>

        <Panel
          title="Odsłony dzień po dniu"
          description="Pusta kolumna to dzień bez wejść, nie brak danych."
        >
          <DashboardBarChart data={traffic.days} name="Odsłony" />
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Najczęściej otwierane strony"
            description="Ścieżki z kodem rezerwacji są tu zbierane pod jedną etykietą."
          >
            <DistributionBars
              items={traffic.topPaths}
              emptyTitle="Brak odsłon"
              emptyDescription="Licznik zbiera dane od pierwszego wejścia na stronę publiczną."
            />
          </Panel>

          <div className="grid gap-4">
            <Panel
              title="Skąd przychodzą"
              description="Sam adres serwisu odsyłającego — bez ścieżki i parametrów."
            >
              <DistributionBars
                items={traffic.referrers}
                emptyTitle="Brak danych o źródłach"
              />
            </Panel>

            <Panel title="Urządzenia">
              <DistributionBars
                items={traffic.devices}
                emptyTitle="Brak danych o urządzeniach"
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
