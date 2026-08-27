import { Fredoka, Nunito } from "next/font/google"

import { SiteFooter } from "@/components/front/layout/site-footer"
import { SiteHeader } from "@/components/front/layout/site-header"
import { cn } from "@/lib/utils"

/**
 * Powłoka strony publicznej.
 *
 * Grupa `(front)` nie zmienia żadnego adresu i nie tworzy drugiego root
 * layoutu — pełne przeładowanie przy przejściu front ↔ panel nie jest do
 * niczego potrzebne, a `data-surface="front"` wystarcza, żeby oba systemy
 * wizualne się nie mieszały (`DESIGN.md`, Sealed-Surface Rule).
 *
 * Fonty ładujemy tutaj, żeby każda podstrona nie musiała ich deklarować u siebie.
 */

const fredoka = Fredoka({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-fredoka",
})

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
})

export default function FrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      data-surface="front"
      className={cn(
        fredoka.variable,
        nunito.variable,
        "flex min-h-svh flex-col bg-front-ground font-body text-front-ink"
      )}
    >
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
