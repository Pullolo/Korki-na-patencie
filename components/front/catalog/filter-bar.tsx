import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Pasek filtrów katalogu.
 *
 * Filtry są zwykłymi linkami, nie stanem Reacta: wynik da się wysłać, dodać
 * do zakładek i otworzyć bez JavaScriptu, a strona zostaje komponentem
 * serwerowym. Wybrana wartość klikniętą drugi raz się zdejmuje.
 */

export type FilterGroup = {
  /** Nazwa parametru w adresie, po polsku — `?przedmiot=matematyka`. */
  key: string
  label: string
  options: { value: string; label: string }[]
}

function buildHref(
  basePath: string,
  params: Record<string, string | undefined>,
  key: string,
  value: string | null
) {
  const next = new URLSearchParams()
  for (const [name, current] of Object.entries(params)) {
    if (current && name !== key) next.set(name, current)
  }
  if (value) next.set(key, value)
  const query = next.toString()
  return query ? `${basePath}?${query}` : basePath
}

export function FilterBar({
  basePath,
  params,
  groups,
  resultLabel,
}: {
  basePath: string
  params: Record<string, string | undefined>
  groups: FilterGroup[]
  resultLabel?: string
}) {
  const active = groups.some((group) => params[group.key])

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 font-body text-sm font-bold text-front-muted">
            {group.label}
          </span>
          <Link
            href={buildHref(basePath, params, group.key, null)}
            aria-current={params[group.key] ? undefined : "true"}
            className={cn(
              "inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 font-body text-sm font-semibold transition-colors duration-150",
              params[group.key]
                ? "bg-front-ground text-front-muted hover:text-front-ink"
                : "bg-front-ink text-front-surface"
            )}
          >
            wszystkie
          </Link>
          {group.options.map((option) => {
            const selected = params[group.key] === option.value
            return (
              <Link
                key={option.value}
                href={buildHref(
                  basePath,
                  params,
                  group.key,
                  selected ? null : option.value
                )}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 font-body text-sm font-semibold transition-colors duration-150",
                  selected
                    ? "bg-front-ink text-front-surface"
                    : "bg-front-ground text-front-muted hover:text-front-ink"
                )}
              >
                {option.label}
              </Link>
            )
          })}
        </div>
      ))}

      {(resultLabel || active) && (
        <p className="flex flex-wrap items-center gap-3 font-body text-sm font-semibold text-front-muted">
          {resultLabel}
          {active && (
            <Link
              href={basePath}
              className="text-front-brand transition-colors hover:underline"
            >
              wyczyść filtry
            </Link>
          )}
        </p>
      )}
    </div>
  )
}
