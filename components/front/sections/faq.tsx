import { ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"

import { cardBase } from "@/components/front/styles"
import type { PublicFaq } from "@/lib/public/faq"
import { cn } from "@/lib/utils"

/**
 * Akordeon pytań. `details`/`summary` zamiast własnego stanu — działa bez
 * JavaScriptu, ma wbudowaną obsługę klawiatury i nie wymaga komponentu
 * klienckiego.
 */
export function FaqList({ items }: { items: PublicFaq[] }) {
  return (
    <div
      className={cn(cardBase, "divide-y divide-front-line overflow-hidden")}
    >
      {items.map((item) => (
        <details key={item.id} className="group px-6 sm:px-7">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {item.question}
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-front-ground text-front-brand transition-transform duration-200 group-open:rotate-180">
              <ChevronDown className="size-5" />
            </span>
          </summary>
          <p className="max-w-[68ch] pb-5 leading-relaxed whitespace-pre-line text-front-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  )
}

export function FaqSection({ items }: { items: PublicFaq[] }) {
  if (items.length === 0) return null

  return (
    <section id="pytania" className="bg-front-surface">
      <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-6 sm:py-24">
        <h2 className="font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          Pytania, które padają najczęściej
        </h2>

        <div className="mt-10">
          <FaqList items={items.slice(0, 6)} />
        </div>

        {items.length > 6 && (
          <Link
            href="/faq"
            className="mt-8 inline-flex items-center gap-2 font-semibold text-front-brand hover:underline"
          >
            Wszystkie pytania i odpowiedzi
            <ArrowRight className="size-4.5" />
          </Link>
        )}
      </div>
    </section>
  )
}
