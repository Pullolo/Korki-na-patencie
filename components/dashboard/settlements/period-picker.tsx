"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { inputClass } from "@/components/dashboard/form-controls"

/**
 * Okres trzymamy w query stringu — rozliczenie konkretnego miesiąca da się
 * wtedy zalinkować i wysłać komuś, kto ma je zatwierdzić.
 */
export function PeriodPicker({
  options,
  selected,
  basePath,
  extraParams,
}: {
  options: Array<{ key: string; label: string }>
  selected: string
  basePath: string
  extraParams?: Record<string, string | undefined>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function go(value: string) {
    const params = new URLSearchParams({ miesiac: value })
    for (const [key, param] of Object.entries(extraParams ?? {})) {
      if (param) params.set(key, param)
    }
    startTransition(() => router.push(`${basePath}?${params.toString()}`))
  }

  return (
    <select
      value={selected}
      disabled={pending}
      onChange={(event) => go(event.target.value)}
      className={`${inputClass} w-auto max-w-48`}
      aria-label="Wybierz okres rozliczenia"
    >
      {options.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
