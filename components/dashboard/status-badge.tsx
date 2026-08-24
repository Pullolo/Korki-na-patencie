import type { BadgeTone } from "@/lib/labels"
import { cn } from "@/lib/utils"

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  red: "bg-destructive/10 text-destructive",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
}

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {label}
    </span>
  )
}
