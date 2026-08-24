import { ClerkProvider } from "@clerk/nextjs"
import { plPL } from "@clerk/localizations"
import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ensureUserSynced } from "@/lib/sync-user"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin-ext"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Korki na patencie",
    template: "%s — Korki na patencie",
  },
  description:
    "Korepetycje z matematyki, fizyki i informatyki — sprawdź wolne terminy i zapisz się online.",
}

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
        <ClerkProvider localization={plPL}>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
