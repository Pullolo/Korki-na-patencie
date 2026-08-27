import { ArrowRight, Compass } from "lucide-react"
import Link from "next/link"

import { btnPrimary, btnSecondary, cardBase } from "@/components/front/styles"
import { cn } from "@/lib/utils"

const SHORTCUTS = [
  { label: "Wolne terminy", href: "/terminy" },
  { label: "Nauczyciele", href: "/nauczyciele" },
  { label: "Przedmioty", href: "/przedmioty" },
  { label: "Cennik", href: "/cennik" },
  { label: "Pytania i odpowiedzi", href: "/faq" },
]

export default function FrontNotFound() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-6 sm:py-28">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-front-brand-soft text-front-brand">
        <Compass className="size-6" />
      </span>
      <h1 className="mt-6 max-w-[18ch] font-display text-4xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
        Tej strony u nas nie ma
      </h1>
      <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-front-muted">
        Adres jest błędny albo strona zmieniła nazwę. Wolne terminy i cennik
        są tam, gdzie były.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/terminy" className={btnPrimary}>
          Zobacz wolne terminy
          <ArrowRight />
        </Link>
        <Link href="/" className={btnSecondary}>
          Strona główna
        </Link>
      </div>

      <nav
        aria-label="Skróty"
        className={cn(cardBase, "mt-10 divide-y divide-front-line overflow-hidden")}
      >
        {SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-4 px-6 py-4 font-semibold transition-colors hover:bg-front-brand-soft hover:text-front-brand"
          >
            {item.label}
            <ArrowRight className="size-4.5 shrink-0" />
          </Link>
        ))}
      </nav>
    </section>
  )
}
