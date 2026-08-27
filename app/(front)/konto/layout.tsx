import type { Metadata } from "next"

import { AccountNav } from "@/components/front/account/account-nav"
import { PageHero } from "@/components/front/layout/page-hero"
import { ensureAccountPage } from "@/lib/auth"

export const metadata: Metadata = {
  title: { default: "Moje konto", template: "%s — Moje konto" },
  robots: { index: false, follow: false },
}

/**
 * Powłoka konta ucznia. Bramka jest tutaj, w layoucie — każda podstrona
 * `/konto/**` dziedziczy ją bez powtarzania sprawdzenia.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await ensureAccountPage()

  return (
    <>
      <PageHero
        crumbs={[{ label: "Moje konto" }]}
        title={`Cześć, ${ctx.firstName ?? ctx.fullName}`}
        lead="Tu masz swoje lekcje, zapisy do grup i dane kontaktowe. Termin odwołasz sam, dopóki mieścisz się w wyprzedzeniu."
      >
        <AccountNav />
      </PageHero>

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-6 sm:py-20">
          {children}
        </div>
      </section>
    </>
  )
}
