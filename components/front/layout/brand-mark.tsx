import { GraduationCap } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Znak marki. Czapka absolwenta jest zaślepką z etapu 1 — do podmiany razem
 * z resztą listy w `docs/FRONTEND.md`, sekcja 13.
 */
export function BrandMark({
  siteName,
  size = "md",
  className,
}: {
  siteName: string
  size?: "sm" | "md"
  className?: string
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center bg-[var(--front-brand-solid)] text-[var(--front-on-brand)]",
          size === "md" ? "size-10 rounded-2xl" : "size-9 rounded-xl"
        )}
      >
        <GraduationCap className={size === "md" ? "size-5" : "size-4.5"} />
      </span>
      <span
        className={cn(
          "font-display font-semibold tracking-tight whitespace-nowrap",
          size === "md" ? "text-base sm:text-lg" : "text-base"
        )}
      >
        {siteName}
      </span>
    </Link>
  )
}
