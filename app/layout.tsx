import { ClerkProvider } from "@clerk/nextjs"
import { plPL } from "@clerk/localizations"
import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { getSiteSettings } from "@/lib/public/settings"
import { SITE_URL } from "@/lib/seo"
import { ensureUserSynced } from "@/lib/sync-user"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin-ext"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const DEFAULT_DESCRIPTION =
  "Korepetycje z matematyki, fizyki i informatyki — sprawdź wolne terminy i zapisz się online."

/**
 * Domyślne meta dla całego serwisu. Podstrony nadpisują je własnym
 * `generateMetadata`, a kolejność źródeł jest zawsze ta sama: encja →
 * `SiteSettings` → wartość domyślna (`docs/FRONTEND.md`, sekcja 9).
 *
 * `metadataBase` jest tu obowiązkowe: bez niego canonical i obrazy OG
 * wychodzą ze ścieżkami względnymi i nie działają w żadnym podglądzie linku.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const name = settings.seoTitle || settings.siteName

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: name, template: `%s — ${settings.siteName}` },
    description: settings.seoDescription || settings.tagline || DEFAULT_DESCRIPTION,
    ...(settings.noIndexSite ? { robots: { index: false, follow: false } } : {}),
  }
}

// Kontrakt kierunku wizualnego strony publicznej. Zostaje w wyrenderowanym
// HTML-u, żeby dało się go zweryfikować na zbudowanej stronie, nie tylko w kodzie.
const DIRECTION_CONTRACT = `<!--
IMPECCABLE DIRECTION CONTRACT - seed dbab1780
THESIS: Strona glowna sprzedaje jedna rzecz - wolny termin, ktory widac i mozna
kliknac. Odmawia sceny "wizytowka korepetytora z numerem telefonu na koncu".
OWN-WORLD: Standard edukacyjny zagrany prosto (poprzeczka: Duolingo, Khan,
Brainly). Jasny fioletowo-bialy grunt, winogronowy #5B47E0 jako marka, cztery
kolory pomocnicze (slonce, koral, mieta, blekit), promienie 20 px, wciskany
przycisk z realnym cieniem, ikony lucide w jednej wadze, Fredoka + Nunito.
STORY: Uczen i rodzic w piec sekund wiedza kto uczy, ile to kosztuje i kiedy
jest wolne - a pierwsza akcja to wybor godziny, nie formularz kontaktowy.
FIRST VIEWPORT: Po lewej naglowek, zdanie i dwa przyciski; po prawej dzialajacy
wybor terminu (przedmiot -> dzien -> godzina -> cena) w bialej karcie.
FORM: standing exit - kanon kategorii, wybrany przez uzytkownika ponad rolka
(przypisana "Zielona tablica", indeks 7, odrzucona swiadomie).
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.
-->`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Konto Clerka musi mieć odpowiednik w naszej bazie, zanim panel spróbuje
  // cokolwiek do niego podpiąć. Błąd bazy nie może wywalić całej strony.
  await ensureUserSynced().catch(() => {})

  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="min-h-screen bg-background text-foreground">
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <ClerkProvider localization={plPL}>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
