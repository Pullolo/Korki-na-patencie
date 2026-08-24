"use client"

import { Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type Variant = "primary" | "ghost" | "danger" | "success"

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  ghost:
    "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
  danger: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  success:
    "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400",
}

export function ActionButton({
  onClick,
  children,
  icon,
  variant = "primary",
  pending,
  done,
  doneLabel,
  disabled,
  title,
  className,
}: {
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
  variant?: Variant
  pending?: boolean
  done?: boolean
  doneLabel?: string
  disabled?: boolean
  title?: string
  className?: string
}) {
  const showDone = done && !pending && doneLabel

  return (
    <button
      onClick={onClick}
      disabled={pending || disabled}
      title={title}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-default disabled:opacity-50",
        VARIANTS[variant],
        className
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : showDone ? (
        <Check className="size-3.5" />
      ) : (
        icon
      )}
      {showDone ? doneLabel : children}
    </button>
  )
}

/** Ikona-przycisk do akcji w wierszach tabel i list. */
export function IconAction({
  onClick,
  icon,
  title,
  pending,
  danger,
}: {
  onClick: () => void
  icon: React.ReactNode
  title: string
  pending?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      title={title}
      aria-label={title}
      className={cn(
        "cursor-pointer rounded-md p-1 text-muted-foreground transition-colors disabled:opacity-50",
        danger ? "hover:text-destructive" : "hover:text-foreground"
      )}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : icon}
    </button>
  )
}
