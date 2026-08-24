import { config as loadEnv } from "dotenv"
import { defineConfig } from "prisma/config"

// Klucze trzymamy w .env.local (tam wrzucił je też Clerk CLI); .env jest fallbackiem.
loadEnv({ path: ".env.local" })
loadEnv()

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
})
