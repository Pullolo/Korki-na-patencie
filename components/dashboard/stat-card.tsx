import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

export type StatCardProps = {
  title: string
  value: string
  /** Zmiana procentowa wobec poprzedniego okresu. */
  change?: number
  changeLabel?: string
  hint?: string
  icon: React.ReactNode
  iconBg?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs poprzedni miesiąc",
  hint,
  icon,
  iconBg = "bg-muted",
}: StatCardProps) {
  const isNeutral = change === undefined || change === 0
  const isPositive = (change ?? 0) > 0

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("rounded-lg p-2", iconBg)}>{icon}</div>
      </div>

      <p className="mb-2 text-2xl font-bold text-foreground">{value}</p>

      {change !== undefined ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
              isNeutral
                ? "bg-muted text-muted-foreground"
                : isPositive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
            )}
          >
            {isNeutral ? (
              <Minus className="size-3" />
            ) : isPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {isNeutral ? "0" : isPositive ? `+${change}` : change}%
          </span>
          <span className="text-xs text-muted-foreground">{changeLabel}</span>
        </div>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
