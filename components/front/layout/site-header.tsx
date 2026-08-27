import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { BrandMark } from "@/components/front/layout/brand-mark"
import { MobileNav } from "@/components/front/layout/mobile-nav"
import { NavLinks } from "@/components/front/layout/nav-links"
import { btnSmall } from "@/components/front/styles"
import { ThemeToggle } from "@/components/front/theme-toggle"
import { canAccessDashboard, roleFromClerk } from "@/lib/auth"
import { getNav } from "@/lib/public/nav"
import { getSiteSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

/**
 * Nagłówek strony publicznej: znak marki, nawigacja z bazy i wejście w konto.
 * Główne wezwanie prowadzi do `/rezerwacja`, nie do rejestracji — konto nie
 * jest bramką do umówienia lekcji (`PRODUCT.md`).
 */
export async function SiteHeader() {
  const [nav, settings, user] = await Promise.all([
    getNav("HEADER"),
    getSiteSettings(),
    currentUser(),
  ])

  const showDashboardLink = user
    ? canAccessDashboard(roleFromClerk(user))
    : false

  return (
    <header className="sticky top-0 z-50 border-b border-front-line bg-front-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-6">
        <BrandMark siteName={settings.siteName} />

        <NavLinks items={nav} />

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {showDashboardLink && (
            <Link
              href="/dashboard"
              className={cn(
                btnSmall,
                "hidden bg-front-ground text-front-ink hover:bg-front-brand-soft hover:text-front-brand sm:inline-flex"
              )}
            >
              Panel
              <ArrowRight />
            </Link>
          )}

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className={cn(
                  btnSmall,
                  "hidden text-front-ink hover:bg-front-brand-soft hover:text-front-brand sm:inline-flex"
                )}
              >
                Zaloguj się
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <Link
              href="/konto"
              className={cn(
                btnSmall,
                "hidden text-front-ink hover:bg-front-brand-soft hover:text-front-brand sm:inline-flex"
              )}
            >
              Moje konto
            </Link>
            <UserButton />
          </Show>

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
            extra={[
              { label: "Kontakt", href: "/kontakt" },
              ...(showDashboardLink
                ? [{ label: "Panel", href: "/dashboard" }]
                : []),
              ...(user ? [{ label: "Moje konto", href: "/konto" }] : []),
            ]}
          />
        </div>
      </div>
    </header>
  )
}
