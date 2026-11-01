import { currentUser } from "@clerk/nextjs/server"
import { cache } from "react"

/**
 * Jedno zapytanie do Clerka na żądanie. Root layout, layout panelu i sama
 * strona renderują się **równolegle** (`node_modules/next/dist/docs/01-app/
 * 01-getting-started/06-fetching-data.md`, „Parallel data fetching"), więc bez
 * `cache()` każde z nich strzelało do API Clerka osobno.
 */
export const getClerkUser = cache(() => currentUser())
