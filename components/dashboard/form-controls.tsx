import { cn } from "@/lib/utils"

/** Wspólne style pól — projekt nie ma jeszcze komponentów input/select z shadcn. */
export const inputClass =
  "w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-foreground transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 focus:outline-none disabled:opacity-50"

export const labelClass =
  "mb-1 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase"

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label className={labelClass} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </p>
  )
}
