import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export const SORT_PARAM = "sortuj"
export const DIR_PARAM = "kierunek"

export type SortDir = "asc" | "desc"

export function parseSortDir(value: string | string[] | undefined): SortDir {
  return value === "asc" ? "asc" : "desc"
}

/**
 * Nagłówek kolumny przełączający sortowanie w query stringu. Sortuje baza, więc
 * kolejność obejmuje wszystkie wiersze, nie tylko te widoczne na liście.
 */
export function SortHeader({
  label,
  column,
  activeColumn,
  dir,
  basePath,
  params,
  defaultDir = "asc",
  className,
}: {
  label: string
  column: string
  /** Kolumna, po której lista jest aktualnie posortowana. */
  activeColumn: string
  dir: SortDir
  basePath: string
  /** Parametry do zachowania przy zmianie sortowania (np. fraza wyszukiwania). */
  params?: Record<string, string | undefined>
  /** Kierunek po pierwszym kliknięciu — dla dat zwykle „desc”. */
  defaultDir?: SortDir
  className?: string
}) {
  const isActive = column === activeColumn
  const nextDir: SortDir = isActive
    ? dir === "asc"
      ? "desc"
      : "asc"
    : defaultDir

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) query.set(key, value)
  }
  query.set(SORT_PARAM, column)
  query.set(DIR_PARAM, nextDir)

  const Icon = !isActive ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown

  return (
    <th
      scope="col"
      aria-sort={
        isActive ? (dir === "asc" ? "ascending" : "descending") : "none"
      }
      className={cn("px-4 py-3 font-medium", className)}
    >
      <Link
        href={`${basePath}?${query.toString()}`}
        scroll={false}
        title={`Sortuj: ${label}`}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-md transition-colors hover:text-foreground",
          isActive && "text-foreground"
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !isActive && "opacity-40")} />
      </Link>
    </th>
  )
}
