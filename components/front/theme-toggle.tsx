"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

// Front dzieli przełącznik motywu z panelem (`next-themes`, klasa na <html>),
// ale ma własny, duży przycisk — dashboardowy jest skalowany pod pasek narzędzi.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
      title={isDark ? "Jasny motyw" : "Ciemny motyw"}
      className="flex size-10 items-center justify-center rounded-xl text-front-muted transition-colors duration-150 hover:bg-front-brand-soft hover:text-front-brand"
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-5" />
        ) : (
          <Moon className="size-5" />
        )
      ) : (
        <span className="size-5" aria-hidden />
      )}
    </button>
  )
}
