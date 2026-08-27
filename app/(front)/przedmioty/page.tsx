import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { SubjectCard } from "@/components/front/catalog/subject-card"
import { PageHero } from "@/components/front/layout/page-hero"
import { getSiteSettings } from "@/lib/public/settings"
import { listSubjectCards } from "@/lib/public/subjects"
import { pageMetadata } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return pageMetadata({
    title: "Przedmioty",
    description: `Czego uczymy w ${settings.siteName}: przedmioty, poziomy nauczania i stawki za godzinę zegarową.`,
    path: "/przedmioty",
  })
}

export default async function SubjectsPage() {
  const [settings, subjects] = await Promise.all([
    getSiteSettings(),
    listSubjectCards(),
  ])

  return (
    <>
      <PageHero
        crumbs={[{ label: "Przedmioty" }]}
        title="Czego uczymy"
        lead="Przy każdym przedmiocie widać poziomy, których ktoś u nas naprawdę uczy, i stawkę za godzinę zegarową. Wejdź w przedmiot, żeby zobaczyć wolne terminy."
      />

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                index={index}
                currency={settings.currency}
                showTeacherCount
              />
            ))}
          </div>

          <Link
            href="/terminy"
            className="mt-10 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
          >
            Wolne terminy we wszystkich przedmiotach
            <ArrowRight className="size-4.5" />
          </Link>
        </div>
      </section>
    </>
  )
}
