import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { currentUser } from "@clerk/nextjs/server"
import { ArrowRight, GraduationCap } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { canAccessDashboard, roleFromClerk } from "@/lib/auth"

export default async function HomePage() {
  const user = await currentUser()
  const showDashboardLink = user
    ? canAccessDashboard(roleFromClerk(user))
    : false

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">
            Korki na patencie
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Base UI podmienia element przez `render`, nie przez `asChild`. */}
          {showDashboardLink && (
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/dashboard" />}
            >
              Panel
              <ArrowRight />
            </Button>
          )}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="lg">
                Zaloguj się
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="lg">Załóż konto</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Korepetycje, na które faktycznie się zapiszesz
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Strona publiczna powstaje w etapie 3 — wyszukiwarka wolnych
            terminów, profile nauczycieli i zapisy online. Na razie działa panel
            do zarządzania grafikiem i rezerwacjami.
          </p>
        </div>
      </main>
    </div>
  )
}
