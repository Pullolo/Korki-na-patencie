"use client"

import { Check, Loader2 } from "lucide-react"
import { useState } from "react"

import { inputClass } from "@/components/dashboard/form-controls"
import { useServerAction } from "@/hooks/use-server-action"
import { setTeacherPayoutRate } from "@/lib/actions/settlements"
import { cn } from "@/lib/utils"

/**
 * Stawka godzinowa nauczyciela — tyle z ceny lekcji trafia do niego, resztę
 * zostawia sobie serwis. Wchodzi do migawki przy **następnej** zapisanej
 * lekcji; rozliczonych kwot nie przelicza, bo w arkuszu też się nie zmieniały.
 */
export function PayoutRateRow({
  teacherProfileId,
  name,
  payoutPerHour,
  currencyLabel,
}: {
  teacherProfileId: string
  name: string
  payoutPerHour: number | null
  currencyLabel: string
}) {
  const { pending, error, done, run, reset } = useServerAction()
  const initial = payoutPerHour === null ? "" : String(payoutPerHour)
  const [text, setText] = useState(initial)
  const [saved, setSaved] = useState(initial)

  function save() {
    const trimmed = text.trim()
    if (trimmed === saved.trim()) return

    const next = trimmed === "" ? null : Number(trimmed.replace(",", "."))
    if (next !== null && !Number.isFinite(next)) {
      setText(saved)
      return
    }
    run(
      () => setTeacherPayoutRate(teacherProfileId, next),
      () => setSaved(trimmed),
      () => setText(saved)
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 truncate text-sm text-foreground">{name}</span>

      <div className="flex shrink-0 items-center gap-1.5">
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            reset()
          }}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              setText(saved)
              event.currentTarget.blur()
            }
          }}
          disabled={pending}
          inputMode="decimal"
          placeholder="—"
          aria-label={`Stawka godzinowa: ${name}`}
          title={error ?? undefined}
          className={cn(
            inputClass,
            "w-20 px-2 py-1 text-right tabular-nums",
            error && "border-destructive"
          )}
        />
        <span className="w-14 text-xs text-muted-foreground">
          {currencyLabel}/h
        </span>
        {pending ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : done ? (
          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <span className="size-3.5" />
        )}
      </div>
    </div>
  )
}
