import Link from "next/link"

import { AccountNav } from "@/components/front/layout/account-nav"
import { BrandMark } from "@/components/front/layout/brand-mark"
import { MobileNav } from "@/components/front/layout/mobile-nav"
import { NavLinks } from "@/components/front/layout/nav-links"
import { btnSmall } from "@/components/front/styles"
import { ThemeToggle } from "@/components/front/theme-toggle"
import { getNav } from "@/lib/public/nav"
import { getSiteSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

/**
 * Nagłówek strony publicznej: znak marki, nawigacja z bazy i wejście w konto.
 * Główne wezwanie prowadzi do `/rezerwacja`, nie do rejestracji — konto nie
 * jest bramką do umówienia lekcji (`PRODUCT.md`).
 *
 * Część zależną od logowania renderuje `AccountNav` w przeglądarce — serwer
 * przy żądaniu RSC nie zawsze widzi świeżą sesję Clerka.
 */
export async function SiteHeader() {
  const [nav, settings] = await Promise.all([getNav("HEADER"), getSiteSettings()])

  return (
    <header className="sticky top-0 z-50 border-b border-front-line bg-front-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-6">
        <BrandMark siteName={settings.siteName} />

        <NavLinks items={nav} />

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          <AccountNav />

          <Link
            href="/rezerwacja"
            className={cn(
              btnSmall,
              "bg-[var(--front-brand-solid)] px-3 text-[var(--front-on-brand)] whitespace-nowrap hover:bg-[var(--front-brand-hover)] sm:px-4"
            )}
          >
            Umów lekcję
          </Link>

          <MobileNav
            items={nav}
            extra={[{ label: "Kontakt", href: "/kontakt" }]}
          />
        </div>
      </div>
    </header>
  )
}
