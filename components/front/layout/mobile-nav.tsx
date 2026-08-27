"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import type { NavItem } from "@/lib/public/nav"
import { cn } from "@/lib/utils"

/**
 * Menu na telefon. Podstron jest kilkanaście, więc nawigacja nie może zniknąć
 * poniżej `lg` razem z paskiem — a uczeń z telefonu jest pierwszym czytelnikiem
 * (`docs/FRONTEND.md`, sekcja 11).
 */
export function MobileNav({
  items,
  extra = [],
}: {
  items: NavItem[]
  extra?: { label: string; href: string }[]
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const links = [
    ...items.flatMap((item) => [
      { label: item.label, href: item.href },
      ...item.children.map((child) => ({
        label: `— ${child.label}`,
        href: child.href,
      })),
    ]),
    ...extra,
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="menu-mobilne"
        aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        className="flex size-10 items-center justify-center rounded-xl text-front-muted transition-colors duration-150 hover:bg-front-brand-soft hover:text-front-brand lg:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div
          className="fixed inset-x-0 top-18 bottom-0 z-40 bg-front-ink/20 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div
        id="menu-mobilne"
        hidden={!open}
        className={cn(
          "fixed inset-x-0 top-18 z-50 max-h-[calc(100svh-4.5rem)] overflow-y-auto border-b border-front-line bg-front-surface px-5 pt-3 pb-6 shadow-[0_18px_40px_-28px_color-mix(in_oklch,var(--front-ink),transparent_60%)] lg:hidden"
        )}
      >
        <nav aria-label="Menu główne" className="flex flex-col">
          {links.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 font-body font-bold text-front-ink transition-colors hover:bg-front-brand-soft hover:text-front-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 font-body font-bold text-front-muted transition-colors hover:bg-front-brand-soft hover:text-front-brand"
        >
          <X className="size-4" />
          Zamknij
        </button>
      </div>
    </>
  )
}
