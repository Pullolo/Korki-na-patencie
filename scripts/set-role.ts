/**
 * Nadaje użytkownikowi rolę w Clerku i w bazie.
 *
 *   pnpm set-role twoj@email.pl ADMIN
 *
 * Potrzebne przy pierwszym uruchomieniu: konto założone przez formularz
 * rejestracji dostaje rolę STUDENT, więc panel jest dla niego zamknięty.
 */
import { PrismaPg } from "@prisma/adapter-pg"
import { config as loadEnv } from "dotenv"

import { PrismaClient } from "../lib/generated/prisma/client"
import { UserRole } from "../lib/generated/prisma/enums"

loadEnv({ path: ".env.local" })
loadEnv()

const CLERK_API = "https://api.clerk.com/v1"

async function clerkFetch(path: string, init?: RequestInit) {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) throw new Error("Brak CLERK_SECRET_KEY w .env.local")

  const response = await fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(
      `Clerk API ${response.status}: ${await response.text().catch(() => "")}`
    )
  }
  return response.json()
}

async function main() {
  const [email, roleArg] = process.argv.slice(2)
  if (!email) {
    console.error("Użycie: pnpm set-role <email> [ADMIN|TEACHER|STUDENT]")
    process.exit(1)
  }

  const role = (roleArg ?? "ADMIN").toUpperCase()
  if (!(role in UserRole)) {
    console.error(`Nieznana rola: ${role}. Dostępne: ADMIN, TEACHER, STUDENT.`)
    process.exit(1)
  }

  const users = (await clerkFetch(
    `/users?email_address=${encodeURIComponent(email)}`
  )) as Array<{ id: string; public_metadata: Record<string, unknown> }>

  const clerkUser = users[0]
  if (!clerkUser) {
    console.error(
      `Nie ma w Clerku konta o adresie ${email}. Zarejestruj się najpierw na /sign-up.`
    )
    process.exit(1)
  }

  await clerkFetch(`/users/${clerkUser.id}/metadata`, {
    method: "PATCH",
    body: JSON.stringify({
      public_metadata: { ...clerkUser.public_metadata, role },
    }),
  })

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
  })
  const prisma = new PrismaClient({ adapter })
  try {
    // Rekord powstaje przy pierwszym wejściu na stronę, więc może go jeszcze nie być.
    const updated = await prisma.user.updateMany({
      where: { clerkId: clerkUser.id },
      data: { role: role as UserRole },
    })
    console.log(
      updated.count > 0
        ? `Rola ${role} ustawiona w Clerku i w bazie dla ${email}.`
        : `Rola ${role} ustawiona w Clerku dla ${email}. Baza zsynchronizuje się przy następnym wejściu na stronę.`
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
