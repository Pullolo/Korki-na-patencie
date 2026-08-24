"use client"

import { ChevronLeft, Moon, RefreshCw, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { cn } from "@/lib/utils"

export type HeaderProps = {
  title: string
  subtitle?: string
  backHref?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, backHref, actions }: HeaderProps) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [refreshing, startRefresh] = useTransition()

  return (
    <header className="sticky top-14 z-40 mt-14 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm sm:px-6 md:top-0 md:mt-0">
      <div className="flex min-w-0 items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Wróć"
          >
            <ChevronLeft className="size-4" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg leading-none font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <button
          onClick={() => startRefresh(() => router.refresh())}
          disabled={refreshing}
          className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Odśwież dane"
          title="Odśwież dane"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </button>
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Przełącz motyw"
        >
          {/* Obie ikony renderujemy zawsze i przełączamy klasą `dark` —
              dzięki temu nie ma rozjazdu przy hydracji ani efektu z setState. */}
          <Moon className="size-4 dark:hidden" />
          <Sun className="hidden size-4 dark:block" />
        </button>
      </div>
    </header>
  )
}
