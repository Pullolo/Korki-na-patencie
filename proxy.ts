import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

/**
 * Wyłącznie **optymistyczny** redirect: niezalogowanego zawracamy z panelu
 * i z konta ucznia, zanim Next zrenderuje RSC i pójdzie po dane do bazy.
 *
 * To nie jest bramka bezpieczeństwa i nigdy nie wolno na niej polegać —
 * dopasowanie po ścieżce potrafi się rozjechać z tym, jak Next naprawdę
 * rozwiązuje trasy (dlatego Clerk wycofał `createRouteMatcher()`).
 * Autorytatywne są `ensureDashboardPage()` / `ensureAccountPage()` w RSC
 * oraz `require*()` w każdej server action (`lib/auth.ts`).
 *
 * Tu sprawdzamy tylko „czy w ogóle jest sesja" — o rolę i o profil pyta
 * dopiero warstwa RSC, bo ta wiedza siedzi w naszej bazie, nie w tokenie.
 */
const GUARDED = ["/dashboard", "/konto"]

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  const guarded = GUARDED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (!guarded) return

  const { userId } = await auth()
  if (userId) return

  const url = request.nextUrl.clone()
  url.pathname = "/sign-in"
  url.search = ""
  // Po zalogowaniu wracamy tam, gdzie ktoś celował.
  url.searchParams.set("redirect_url", request.nextUrl.pathname)
  return NextResponse.redirect(url)
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
}
