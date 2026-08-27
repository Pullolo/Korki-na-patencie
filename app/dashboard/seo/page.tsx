import { ExternalLink } from "lucide-react"
import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { Panel } from "@/components/dashboard/panel"
import { SeoForm } from "@/components/dashboard/seo-form"
import { ensureAdminPage } from "@/lib/auth"
import { getSiteSettings } from "@/lib/queries/settings"
import { SITE_URL } from "@/lib/seo"

export const metadata: Metadata = { title: "SEO" }

const FILES = [
  {
    path: "/sitemap.xml",
    label: "Mapa witryny",
    description:
      "Trasy stałe plus slugi nauczycieli, przedmiotów, grup i stron CMS. Strony z noindex wypadają.",
  },
  {
    path: "/robots.txt",
    label: "Robots",
    description:
      "Zamyka panel, konto ucznia i strony pod kodem. Przy ukrytym serwisie zamyka wszystko.",
  },
]

export default async function SeoPage() {
  await ensureAdminPage()
  const settings = await getSiteSettings().catch(() => null)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="SEO"
        subtitle="Domyślne meta tagi i widoczność w wyszukiwarkach"
      />

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <Panel
          title="Meta tagi serwisu"
          description="Wartości domyślne dla tras, które nie mają własnych."
        >
          <SeoForm
            siteName={settings?.siteName ?? "Korki na patencie"}
            initial={{
              seoTitle: settings?.seoTitle ?? null,
              seoDescription: settings?.seoDescription ?? null,
              seoOgImage: settings?.seoOgImage ?? null,
              noIndexSite: settings?.noIndexSite ?? false,
            }}
          />
        </Panel>

        <Panel
          title="Pliki techniczne"
          description={`Generowane przy każdym żądaniu z adresu ${SITE_URL}`}
        >
          <ul className="divide-y divide-border">
            {FILES.map((file) => (
              <li key={file.path} className="py-3 first:pt-0 last:pb-0">
                <a
                  href={file.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                >
                  {file.label}
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {file.description}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
