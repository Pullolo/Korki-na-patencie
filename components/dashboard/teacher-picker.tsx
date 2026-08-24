"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { inputClass } from "@/components/dashboard/form-controls"

export const ALL_TEACHERS = "wszyscy"

/**
 * Admin nie ma własnego profilu, więc wybiera, czyj grafik ogląda.
 * Wybór trzymamy w query stringu, żeby dało się go zalinkować i odświeżyć.
 */
export function TeacherPicker({
  teachers,
  selectedId,
  basePath,
  allowAll,
  extraParams,
}: {
  teachers: Array<{ id: string; name: string }>
  selectedId: string
  basePath: string
  /** Dodaje opcję „wszyscy nauczyciele" — ma sens tam, gdzie da się złożyć wspólny widok. */
  allowAll?: boolean
  extraParams?: Record<string, string | undefined>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function go(value: string) {
    const params = new URLSearchParams({ nauczyciel: value })
    for (const [key, param] of Object.entries(extraParams ?? {})) {
      if (param) params.set(key, param)
    }
    startTransition(() => router.push(`${basePath}?${params.toString()}`))
  }

  return (
    <select
      value={selectedId}
      disabled={pending}
      onChange={(event) => go(event.target.value)}
      className={`${inputClass} w-auto max-w-56`}
      aria-label="Wybierz nauczyciela"
    >
      {allowAll && <option value={ALL_TEACHERS}>Wszyscy nauczyciele</option>}
      {teachers.map((teacher) => (
        <option key={teacher.id} value={teacher.id}>
          {teacher.name}
        </option>
      ))}
    </select>
  )
}
