"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const TABS = [
  { href: "/konto", label: "Nadchodzące" },
  { href: "/konto/lekcje", label: "Historia lekcji" },
  { href: "/konto/grupy", label: "Moje grupy" },
  { href: "/konto/dane", label: "Dane" },
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Menu konta" className="flex flex-wrap gap-1.5">
      {TABS.map((tab) => {
        const active =
          tab.href === "/konto"
            ? pathname === "/konto"
            : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 font-body text-sm font-bold transition-colors duration-150",
              active
                ? "bg-front-ink text-front-surface"
                : "bg-front-surface text-front-muted hover:text-front-ink"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
