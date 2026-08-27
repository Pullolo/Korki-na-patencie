import { ArrowRight, Clock3, Mail, MapPin, Phone } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { ContactForm } from "@/components/front/forms/contact-form"
import { PageHero } from "@/components/front/layout/page-hero"
import { cardBase } from "@/components/front/styles"
import { formStamp } from "@/lib/actions/public/guard"
import { listLevels } from "@/lib/public/levels"
import { firstParam } from "@/lib/public/modes"
import { getSiteSettings } from "@/lib/public/settings"
import { listSubjects } from "@/lib/public/subjects"
import { listTeachers } from "@/lib/public/teachers"
import { pageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

type SearchParams = {
  przedmiot?: string | string[]
  poziom?: string | string[]
  nauczyciel?: string | string[]
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return pageMetadata({
    title: "Kontakt",
    description: `Napisz, z czym jest problem — odpowiadamy tego samego dnia i proponujemy wolny termin. ${settings.contactPhone ? `Telefon: ${settings.contactPhone}.` : ""}`.trim(),
    path: "/kontakt",
  })
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [settings, subjects, levels, teachers] = await Promise.all([
    getSiteSettings(),
    listSubjects(),
    listLevels(),
    listTeachers(),
  ])

  const contact = [
    settings.contactPhone && {
      icon: Phone,
      label: "Telefon",
      value: settings.contactPhone,
      href: `tel:${settings.contactPhone.replace(/\s/g, "")}`,
    },
    settings.contactEmail && {
      icon: Mail,
      label: "E-mail",
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    settings.contactAddress && {
      icon: MapPin,
      label: "Gdzie jesteśmy",
      value: settings.contactAddress,
      href: null,
    },
  ].filter(Boolean) as {
    icon: typeof Phone
    label: string
    value: string
    href: string | null
  }[]

  return (
    <>
      <PageHero
        crumbs={[{ label: "Kontakt" }]}
        title="Napisz, z czym jest problem"
        lead="Odpowiadamy tego samego dnia i od razu proponujemy wolny termin. Jeśli wolisz sam wybrać godzinę, zrobisz to w wyszukiwarce terminów."
      />

      <section className="bg-front-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-14">
          <ContactForm
            subjects={subjects.map((item) => ({
              slug: item.slug,
              name: item.name,
            }))}
            levels={levels.map((item) => ({
              slug: item.slug,
              name: item.name,
            }))}
            teachers={teachers.map((item) => ({
              slug: item.slug,
              name: item.name,
            }))}
            initial={{
              subjectSlug: firstParam(params.przedmiot),
              levelSlug: firstParam(params.poziom),
              teacherSlug: firstParam(params.nauczyciel),
            }}
            stamp={formStamp()}
          />

          <aside className="grid gap-5">
            {contact.length > 0 && (
              <div className={cn(cardBase, "p-6")}>
                <h2 className="font-display text-xl font-semibold">
                  Szybciej niż mailem
                </h2>
                <ul className="mt-4 grid gap-4">
                  {contact.map((item) => (
                    <li key={item.label} className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-front-brand-soft text-front-brand">
                        <item.icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-body text-sm font-bold text-front-muted">
                          {item.label}
                        </span>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="font-semibold break-words transition-colors hover:text-front-brand"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <span className="font-semibold">{item.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={cn(cardBase, "p-6")}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-front-mint-soft text-front-mint">
                <Clock3 className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold">
                Wolisz od razu wybrać godzinę?
              </h2>
              <p className="mt-2 leading-relaxed text-front-muted">
                Grafik na stronie jest prawdziwy. Godzina, którą widzisz, jest
                naprawdę wolna — i zajmiesz ją bez zakładania konta.
              </p>
              <Link
                href="/terminy"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
              >
                Wolne terminy
                <ArrowRight className="size-4.5" />
              </Link>
            </div>

            <div className={cn(cardBase, "p-6")}>
              <h2 className="font-display text-xl font-semibold">
                Zanim napiszesz
              </h2>
              <p className="mt-2 leading-relaxed text-front-muted">
                Ceny, zasady odwoływania i różnice między zajęciami
                indywidualnymi a grupowymi są opisane wprost.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href="/cennik"
                  className="font-semibold text-front-brand hover:underline"
                >
                  Cennik
                </Link>
                <Link
                  href="/faq"
                  className="font-semibold text-front-brand hover:underline"
                >
                  Pytania i odpowiedzi
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
