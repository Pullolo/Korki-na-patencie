"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import type { NavItem } from "@/lib/public/nav"
import { cn } from "@/lib/utils"

/**
 * Nawigacja główna — widoczna od `lg` (`DESIGN.md`, Navigation).
 *
 * Podmenu rozwija się na hover i na `focus-within`, bez JS-a: pozycja z
 * dziećmi to zwykły link plus panel, więc klawiatura dostaje ten sam dostęp
 * co mysz, a menu nie potrzebuje stanu.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Menu główne" className="hidden items-center gap-1 lg:flex">
      {items.map((item) => {
        const active =
          item.href !== "/" &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`))

        if (item.children.length === 0) {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-xl px-3 py-2 font-body font-semibold transition-colors",
                active
                  ? "bg-front-brand-soft text-front-brand"
                  : "text-front-muted hover:bg-front-brand-soft hover:text-front-brand"
              )}
            >
              {item.label}
            </Link>
          )
        }

        return (
          <div key={item.href} className="group relative">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1 rounded-xl px-3 py-2 font-body font-semibold transition-colors",
                active
                  ? "bg-front-brand-soft text-front-brand"
                  : "text-front-muted hover:bg-front-brand-soft hover:text-front-brand"
              )}
            >
              {item.label}
              <ChevronDown className="size-4" />
            </Link>
            <div className="invisible absolute top-full left-0 z-50 min-w-52 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="rounded-2xl border border-front-line bg-front-surface p-1.5 shadow-[0_18px_40px_-28px_color-mix(in_oklch,var(--front-ink),transparent_60%)]">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block rounded-xl px-3 py-2 font-body font-semibold text-front-muted transition-colors hover:bg-front-brand-soft hover:text-front-brand"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
