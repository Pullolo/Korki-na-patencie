import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import Link from "next/link"

import { btnPrimary, btnSecondary } from "@/components/front/styles"
import type { PublicSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

/**
 * Pełnokolorowe pasmo kontaktowe — jedyne miejsce, gdzie marka jest gruntem
 * (`DESIGN.md`, Tertiary). Numer i adres pochodzą z ustawień serwisu; gdy
 * ich nie ma, zostaje formularz, bo on działa zawsze.
 */
export function CtaSection({ settings }: { settings: PublicSettings }) {
  return (
    <section
      id="kontakt"
      className="bg-front-ground px-5 pt-20 pb-20 sm:px-6 sm:pt-24 sm:pb-24"
    >
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[32px] bg-[var(--front-cta)] px-6 py-16 text-center sm:px-12">
        <h2 className="mx-auto max-w-[18ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance text-[var(--front-on-cta)] sm:text-5xl">
          Napisz, z czym jest problem
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-lg leading-relaxed text-[var(--front-on-cta-muted)]">
          Odpowiadamy tego samego dnia i od razu proponujemy wolny termin.
          Pierwsza lekcja nie zobowiązuje do niczego dalej.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {settings.contactPhone ? (
            <a
              href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
              className={cn(
                btnPrimary,
                "bg-[var(--front-on-cta)] text-[var(--front-cta)] shadow-[0_4px_0_0_var(--front-cta-pill-edge)] hover:bg-[var(--front-on-cta-muted)] active:shadow-[0_1px_0_0_var(--front-cta-pill-edge)]"
              )}
            >
              <Phone />
              {settings.contactPhone}
            </a>
          ) : (
            <Link
              href="/kontakt"
              className={cn(
                btnPrimary,
                "bg-[var(--front-on-cta)] text-[var(--front-cta)] shadow-[0_4px_0_0_var(--front-cta-pill-edge)] hover:bg-[var(--front-on-cta-muted)] active:shadow-[0_1px_0_0_var(--front-cta-pill-edge)]"
              )}
            >
              <MessageCircle />
              Napisz do nas
            </Link>
          )}

          {settings.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className={cn(
                btnSecondary,
                "border-[var(--front-cta-border)] bg-transparent text-[var(--front-on-cta)] shadow-[0_4px_0_0_var(--front-cta-edge)] hover:border-[var(--front-on-cta)] active:shadow-[0_1px_0_0_var(--front-cta-edge)]"
              )}
            >
              <Mail />
              {settings.contactEmail}
            </a>
          )}

          {settings.contactPhone && (
            <Link
              href="/kontakt"
              className={cn(
                btnSecondary,
                "border-[var(--front-cta-border)] bg-transparent text-[var(--front-on-cta)] shadow-[0_4px_0_0_var(--front-cta-edge)] hover:border-[var(--front-on-cta)] active:shadow-[0_1px_0_0_var(--front-cta-edge)]"
              )}
            >
              <MessageCircle />
              Formularz
            </Link>
          )}
        </div>

        {settings.contactAddress && (
          <p className="mt-7 flex items-center justify-center gap-2 font-semibold text-[var(--front-on-cta-muted)]">
            <MapPin className="size-5" />
            {settings.contactAddress}
          </p>
        )}
      </div>
    </section>
  )
}
