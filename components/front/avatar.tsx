import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Zdjęcie nauczyciela albo jego inicjały. Avatary przychodzą z Clerka
 * (`img.clerk.com` w `next.config.ts`); nauczyciel wpisany ręcznie w panelu
 * zdjęcia nie ma i wtedy inicjały są pełnoprawnym wariantem, nie awarią.
 */
export function Avatar({
  name,
  imageUrl,
  tone = "bg-front-brand-soft text-front-brand",
  size = 56,
  className,
}: {
  name: string
  imageUrl?: string | null
  tone?: string
  size?: number
  className?: string
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-2xl object-cover", className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl font-display font-semibold",
        tone,
        className
      )}
    >
      {initials || "?"}
    </span>
  )
}
