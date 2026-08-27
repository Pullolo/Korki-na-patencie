import { ExternalLink, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"

import { BrandMark } from "@/components/front/layout/brand-mark"
import { getNav } from "@/lib/public/nav"
import { listPublishedPages } from "@/lib/public/pages"
import { getSiteSettings } from "@/lib/public/settings"

/**
 * Stopka: nawigacja z bazy, dane kontaktowe z ustawień i wszystkie
 * opublikowane strony CMS — regulamin i polityka prywatności muszą być
 * osiągalne z każdej podstrony, bo formularze linkują do zgody.
 */
export async function SiteFooter() {
  const [nav, settings, pages] = await Promise.all([
    getNav("FOOTER"),
    getSiteSettings(),
    listPublishedPages(),
  ])

  const contact = [
    settings.contactPhone && {
      icon: Phone,
      label: settings.contactPhone,
      href: `tel:${settings.contactPhone.replace(/\s/g, "")}`,
    },
    settings.contactEmail && {
      icon: Mail,
      label: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    settings.contactAddress && {
      icon: MapPin,
      label: settings.contactAddress,
      href: null,
    },
  ].filter(Boolean) as {
    icon: typeof Phone
    label: string
    href: string | null
  }[]

  // Lucide nie ma już ikon marek, więc portale społecznościowe podpisujemy
  // nazwą — i tak czyta się to lepiej niż sam znaczek.
  const social = [
    settings.socialFacebook && {
      label: "Facebook",
      href: settings.socialFacebook,
    },
    settings.socialInstagram && {
      label: "Instagram",
      href: settings.socialInstagram,
    },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <footer className="border-t border-front-line bg-front-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandMark siteName={settings.siteName} size="sm" />
            {settings.tagline && (
              <p className="mt-4 max-w-[46ch] leading-relaxed text-front-muted">
                {settings.tagline}
              </p>
            )}
            {social.length > 0 && (
              <div className="mt-5 flex gap-2">
                {social.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-front-ground px-3.5 font-body text-sm font-bold text-front-muted transition-colors hover:bg-front-brand-soft hover:text-front-brand"
                  >
                    {item.label}
                    <ExternalLink className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-base font-semibold">Serwis</h2>
            <nav aria-label="Menu w stopce" className="mt-4 flex flex-col gap-2.5">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-semibold text-front-muted transition-colors hover:text-front-brand"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="font-display text-base font-semibold">Kontakt</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {contact.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="flex items-center gap-2 font-semibold text-front-muted transition-colors hover:text-front-brand"
                    >
                      <item.icon className="size-4.5 shrink-0" />
                      {item.label}
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-front-muted">
                      <item.icon className="size-4.5 shrink-0" />
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
              <li>
                <Link
                  href="/kontakt"
                  className="font-semibold text-front-brand transition-colors hover:underline"
                >
                  Formularz kontaktowy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-front-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[46ch] text-sm text-front-muted">
            © {new Date().getFullYear()} {settings.siteName} · zrobione dla
            tych, którym nikt nie wytłumaczył za pierwszym razem
          </p>
          {pages.length > 0 && (
            <nav
              aria-label="Dokumenty"
              className="flex flex-wrap gap-x-5 gap-y-2"
            >
              {pages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="text-sm font-semibold text-front-muted transition-colors hover:text-front-brand"
                >
                  {page.title}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  )
}
