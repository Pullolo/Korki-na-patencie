"use client"

import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { btnSmall } from "@/components/front/styles"
import { canAccessDashboard, roleFromClerk } from "@/lib/roles"
import { cn } from "@/lib/utils"

const linkClass = cn(
  btnSmall,
  "hidden text-front-ink hover:bg-front-brand-soft hover:text-front-brand sm:inline-flex"
)

/**
 * Stan logowania w nagłówku liczony w przeglądarce, nie na serwerze.
 *
 * Serwerowy `<Show>` Clerka czyta `auth()`, a żądanie RSC — nawigacja po
 * kliknięciu w link albo `router.refresh()` po zalogowaniu w okienku — potrafi
 * wyjść jako „wylogowany", choć sesja jest ważna: Clerk odświeża token tylko
 * przy żądaniu o dokument (`isRequestEligibleForHandshake()`). Nagłówek
 * pokazywał wtedy „Zaloguj się" osobie, która właśnie się zalogowała.
 */
export function AccountNav() {
  const { isLoaded, isSignedIn, user } = useUser()

  // Dopóki Clerk się nie wczyta, nie zgadujemy — nic nie pokazujemy zamiast
  // mignięcia złym stanem.
  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button type="button" className={linkClass}>
          Zaloguj się
        </button>
      </SignInButton>
    )
  }

  return (
    <>
      {canAccessDashboard(roleFromClerk(user)) && (
        <Link
          href="/dashboard"
          className={cn(
            btnSmall,
            "hidden bg-front-ground text-front-ink hover:bg-front-brand-soft hover:text-front-brand sm:inline-flex"
          )}
        >
          Panel
          <ArrowRight />
        </Link>
      )}

      <Link href="/konto" className={linkClass}>
        Moje konto
      </Link>

      <UserButton />
    </>
  )
}
