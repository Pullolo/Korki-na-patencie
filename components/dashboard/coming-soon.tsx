import { Construction } from "lucide-react"

import { Header } from "@/components/dashboard/header"

/**
 * Szkielet strony dla pozycji z sidebara, które trafią do etapu 2.
 * Dzięki temu nawigacja jest kompletna, a nie prowadzi w 404.
 */
export function ComingSoon({
  title,
  subtitle,
  planned,
  stage = "etap 2",
}: {
  title: string
  subtitle?: string
  planned: string[]
  /** Etap z docs/PLAN.md, na który zaplanowana jest ta sekcja. */
  stage?: string
}) {
  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header title={title} subtitle={subtitle} />
      <div className="p-4 sm:p-6">
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-muted">
            <Construction className="size-5 text-muted-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Sekcja w przygotowaniu
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Model danych jest już gotowy — brakuje interfejsu. Zaplanowane na{" "}
            {stage}.
          </p>
          <ul className="mt-5 space-y-2 border-t border-border pt-5 text-left">
            {planned.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
