import { ArrowRight, MessageCircle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { JsonLd } from "@/components/front/json-ld"
import { PageHero } from "@/components/front/layout/page-hero"
import { FaqList } from "@/components/front/sections/faq"
import { btnPrimary, btnSecondary, cardBase } from "@/components/front/styles"
import { groupFaq, listFaq } from "@/lib/public/faq"
import { pageMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Pytania i odpowiedzi",
    description:
      "Jak wygląda pierwsza lekcja, kiedy można odwołać termin, jak płacimy i czym różnią się zajęcia grupowe od indywidualnych.",
    path: "/faq",
  })
}

export default async function FaqPage() {
  const items = await listFaq()
  const groups = groupFaq(items)

  // Pytania i odpowiedzi to jedyne dane strukturalne, które opisują treść
  // widoczną na stronie jeden do jednego — dlatego wolno je zgłosić.
  const faqPage =
    items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null

  return (
    <>
      {faqPage && <JsonLd data={faqPage} />}
      <PageHero
        crumbs={[{ label: "Pytania" }]}
        title="Pytania, które padają najczęściej"
        lead="Jeśli czegoś tu nie ma, napisz — dopiszemy odpowiedź, a nie tylko odpiszemy Tobie."
      />

      <section className="bg-front-surface">
        <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-6 sm:py-20">
          {groups.length > 0 ? (
            <div className="grid gap-10">
              {groups.map((group) => (
                <div key={group.category}>
                  <h2 className="font-display text-2xl font-semibold tracking-tight">
                    {group.category}
                  </h2>
                  <div className="mt-4">
                    <FaqList items={group.questions} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={cn(cardBase, "p-8 text-center")}>
              <h2 className="font-display text-2xl font-semibold">
                Lista pytań jest jeszcze pusta
              </h2>
              <p className="mx-auto mt-2 max-w-[46ch] leading-relaxed text-front-muted">
                Zadaj pierwsze — odpowiemy i od razu dopiszemy je tutaj.
              </p>
              <Link href="/kontakt" className={cn(btnSecondary, "mt-6")}>
                <MessageCircle />
                Napisz do nas
              </Link>
            </div>
          )}

          <div className="mt-12 rounded-[28px] bg-front-brand-soft p-8 text-center">
            <h2 className="font-display text-2xl font-semibold">
              Nie ma Twojego pytania?
            </h2>
            <p className="mx-auto mt-2 max-w-[46ch] leading-relaxed text-front-muted">
              Napisz jedno zdanie o tym, z czym jest problem. Odpowiadamy tego
              samego dnia.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/kontakt" className={btnPrimary}>
                Zadaj pytanie
                <ArrowRight />
              </Link>
              <Link href="/terminy" className={btnSecondary}>
                Zobacz wolne terminy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
