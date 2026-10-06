import {
  clerkMiddleware,
  type ClerkMiddlewareOptions,
} from "@clerk/nextjs/server"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Zapas na rozjechany zegar — wyłącznie poza produkcją.
 *
 * Clerk sprawdza `nbf` i `exp` tokenu sesji z tolerancją 5 s. Zegar Windowsa
 * potrafi spóźnić się o kilkanaście sekund (brak synchronizacji z serwerem
 * czasu) i wtedy **każdy** token jest „jeszcze nieważny": serwer odsyła na
 * handshake, dostaje kolejny tak samo nieważny token i po trzech obrotach
 * uznaje zalogowaną osobę za wylogowaną. Przeglądarka ma wtedy sesję, a panel
 * jest zamknięty.
 *
 * To tylko zapas na czas pracy lokalnej — prawdziwym lekarstwem jest
 * `w32tm /resync`. Na produkcji zostaje domyślna tolerancja.
 *
 * `clockSkewInMs` nie figuruje w typach opcji, ale ląduje w kontekście
 * uwierzytelnienia (`Object.assign(this, options)` w `@clerk/backend`) i stamtąd
 * trafia do `verifyToken()`.
 */
const clerkOptions = (
  process.env.NODE_ENV === "production" ? {} : { clockSkewInMs: 5 * 60_000 }
) as ClerkMiddlewareOptions

/**
 * Trasy, których nie ma po co renderować bez sesji. Dopasowanie po ścieżce
 * wystarcza, bo to tylko optymistyczna bramka — `createRouteMatcher` z Clerka
 * jest wycofany, a prawdziwe sprawdzenie i tak robią `ensureDashboardPage()`
 * i `ensureAccountPage()` z `lib/auth.ts`.
 */
function isProtectedRoute(request: NextRequest) {
  const path = request.nextUrl.pathname
  return (
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/konto" ||
    path.startsWith("/konto/")
  )
}

/**
 * Czy przeglądarka ma aktywną sesję Clerka. `__client_uat` to znacznik czasu
 * ostatniego logowania (`0` albo brak = wylogowany); w instancji deweloperskiej
 * ciasteczko dostaje sufiks klucza, więc patrzymy na prefiks nazwy.
 */
function hasClerkSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("__client_uat") &&
        cookie.value !== "" &&
        cookie.value !== "0"
    )
}

/**
 * Te same warunki, po których Clerk poznaje żądanie o dokument
 * (`isRequestEligibleForHandshake()` w `@clerk/backend`). Tylko takie żądanie
 * Clerk umie naprawić handshakiem — reszta dostaje stan „wylogowany".
 *
 * Nagłówka `rsc` tu nie sprawdzamy: Next odcina nagłówki RSC, zanim proxy je
 * zobaczy, więc zostaje sygnał od przeglądarki.
 */
function isDocumentRequest(request: NextRequest) {
  const dest = request.headers.get("sec-fetch-dest")
  if (dest) return dest === "document" || dest === "iframe"
  return request.headers.get("accept")?.startsWith("text/html") ?? false
}

export default clerkMiddleware(async (auth, request) => {
  if (!isProtectedRoute(request)) return

  const { userId, redirectToSignIn } = await auth()
  if (userId) return

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[auth] ${request.nextUrl.pathname}: żądanie bez sesji Clerka`, {
      metoda: request.method,
      dokument: isDocumentRequest(request),
      ciasteczka: request.cookies
        .getAll()
        .filter((cookie) => cookie.name.startsWith("__"))
        .map((cookie) => cookie.name),
    })
  }

  // Server action (POST). Redirectu tu nie ma po co wysyłać — formularz
  // dostałby zamiast odpowiedzi akcji stronę logowania i pokazał błąd bez
  // treści. Niech akcja dojdzie do swojej bramki (`requireDashboardUser()`
  // i spółka) i zwróci komunikat po polsku.
  if (request.method !== "GET") return

  // Sesja w przeglądarce jest, a to żądanie jej nie widzi: token sesji żyje
  // minutę, a instancja deweloperska wymaga dodatkowo ciasteczka
  // `__clerk_db_jwt`. Jedno i drugie Clerk odświeża **tylko** przy żądaniu
  // o dokument, więc nawigacja po kliknięciu w link (żądanie RSC) wychodziła
  // jako „wylogowany" i leciała na /sign-in — czasem jeszcze przed
  // kliknięciem, bo Next podpytuje trasy w tle (prefetch) i zapamiętuje
  // odpowiedź.
  //
  // Odpowiedź, która nie jest payloadem RSC, Next zamienia na twarde przejście
  // („If the fetch was not 200, we also handle it like a mpa navigation" —
  // `next/dist/client/components/router-reducer/fetch-server-response.js`).
  // Leci wtedy żądanie o dokument, Clerk odświeża sesję i strona otwiera się
  // normalnie, zamiast wyrzucać kogoś z panelu.
  if (!isDocumentRequest(request) && hasClerkSessionCookie(request)) {
    return new NextResponse(null, { status: 401 })
  }

  // Optymistyczny redirect — bramki w RSC i tak sprawdzą wszystko ponownie.
  const back = new URL(request.nextUrl)
  back.searchParams.delete("_rsc")
  return redirectToSignIn({ returnBackUrl: back.toString() })
}, clerkOptions)

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
}
