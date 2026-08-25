"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

// Front dzieli przełącznik motywu z panelem (`next-themes`, klasa na <html>),
// ale ma własny, duży przycisk — dashboardowy jest skalowany pod pasek narzędzi.
//
// Który motyw jest aktywny, decyduje CSS przez wariant `dark:`, a nie stan
// Reacta. Dzięki temu nie ma ani migotania przy hydratacji, ani efektu
// ustawiającego stan po zamontowaniu.
export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark") ? "light" : "dark"
        )
      }
      aria-label="Przełącz motyw jasny i ciemny"
      title="Przełącz motyw"
      className="flex size-10 items-center justify-center rounded-xl text-front-muted transition-colors duration-150 hover:bg-front-brand-soft hover:text-front-brand"
    >
      <Moon className="size-5 dark:hidden" />
      <Sun className="hidden size-5 dark:block" />
    </button>
  )
}
