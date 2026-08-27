import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

/**
 * Wspólny nagłówek podstron. Kilkanaście tras nie może wymyślić kilkunastu
 * wariantów tego samego (`docs/FRONTEND.md`, sekcja 8): siatka kropek jak
 * w hero, okruszki, nagłówek `h1` z miarą i jeden akapit wprowadzenia.
 */
export function PageHero({
  title,
  lead,
  crumbs = [],
  children,
  className,
}: {
  title: React.ReactNode
  lead?: React.ReactNode
  crumbs?: Crumb[]
  children?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("relative overflow-hidden bg-front-ground", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--front-dots)_1.1px,transparent_1.1px)] [background-size:22px_22px] opacity-60"
      />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        {crumbs.length > 0 && (
          <nav aria-label="Okruszki" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 font-body text-sm font-semibold text-front-muted">
              <li className="flex items-center gap-1">
                <Link href="/" className="transition-colors hover:text-front-brand">
                  Start
                </Link>
                <ChevronRight aria-hidden className="size-4 shrink-0" />
              </li>
              {crumbs.map((crumb, index) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-front-brand"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-front-ink">{crumb.label}</span>
                  )}
                  {index < crumbs.length - 1 && (
                    <ChevronRight aria-hidden className="size-4 shrink-0" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <h1 className="max-w-[20ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          {title}
        </h1>

        {lead && (
          <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-front-muted">
            {lead}
          </p>
        )}

        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}
