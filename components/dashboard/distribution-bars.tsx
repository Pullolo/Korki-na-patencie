import { EmptyState } from "@/components/dashboard/panel"
import { cn } from "@/lib/utils"

export type DistributionItem = {
  label: string
  value: number
  /** Dodatkowa informacja po prawej, np. kwota. */
  suffix?: string
  color?: string
}

/**
 * Rozkład w formie poziomych słupków. Dla kilku kategorii czyta się to lepiej
 * niż wykres kołowy — widać i kolejność, i konkretne liczby.
 */
export function DistributionBars({
  items,
  emptyTitle = "Brak danych",
  emptyDescription,
}: {
  items: DistributionItem[]
  emptyTitle?: string
  emptyDescription?: string
}) {
  const max = Math.max(...items.map((item) => item.value), 1)
  const total = items.reduce((sum, item) => sum + item.value, 0)

  if (items.length === 0 || total === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate text-foreground">{item.label}</span>
            <span className="shrink-0 text-muted-foreground">
              {item.suffix ? `${item.value} · ${item.suffix}` : item.value}
              <span className="ml-1.5 opacity-70">
                {Math.round((item.value / total) * 100)}%
              </span>
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full")}
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? "var(--primary)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
