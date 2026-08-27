import { cn } from "@/lib/utils"

/**
 * Ślad zakreślacza pod słowem w nagłówku — leży pod tekstem (`z-0` vs `z-10`),
 * więc nie rusza kontrastu ani zaznaczania (`DESIGN.md`, Shapes).
 */
export function Marker({
  children,
  tone = "bg-front-brand-soft",
}: {
  children: React.ReactNode
  tone?: string
}) {
  return (
    <span className="relative inline-block">
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-[-0.12em] bottom-[0.12em] z-0 h-[0.46em] -rotate-1 rounded-[0.15em]",
          tone
        )}
      />
      <span className="relative z-10">{children}</span>
    </span>
  )
}
