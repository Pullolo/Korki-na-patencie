import { CheckCircle2, XCircle } from "lucide-react"
import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { ensureAdminPage } from "@/lib/auth"
import { formatDateTime } from "@/lib/format"
import { environmentSummary, runHealthChecks } from "@/lib/queries/health"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Status systemu" }

// Sprawdzenia mają pokazywać stan na teraz, nie sprzed cache'a.
export const dynamic = "force-dynamic"

export default async function StatusPage() {
  await ensureAdminPage()
  const checks = await runHealthChecks()
  const env = environmentSummary()
  const allOk = checks.every((check) => check.ok)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Status systemu"
        subtitle={`Sprawdzone ${formatDateTime(new Date())}`}
      />

      <div className="space-y-4 p-4 sm:p-6">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4",
            allOk
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-destructive/30 bg-destructive/10"
          )}
        >
          {allOk ? (
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="size-5 text-destructive" />
          )}
          <p className="text-sm font-medium text-foreground">
            {allOk
              ? "Wszystkie usługi odpowiadają"
              : "Któraś z usług nie odpowiada — szczegóły poniżej"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {checks.map((check) => (
            <div
              key={check.name}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{check.name}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    check.ok
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {check.ok ? "OK" : "Błąd"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{check.detail}</p>
              {check.latencyMs !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Czas odpowiedzi: {check.latencyMs} ms
                </p>
              )}
            </div>
          ))}
        </div>

        <Panel title="Konfiguracja">
          <dl className="divide-y divide-border text-sm">
            {env.map((item) => (
              <div key={item.label} className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="text-right text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  )
}
