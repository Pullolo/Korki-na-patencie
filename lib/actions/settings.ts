"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type SiteSettingsInput = {
  siteName: string
  tagline: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactAddress: string | null
  socialFacebook: string | null
  socialInstagram: string | null
  currency: string
  bookingMinLeadHours: number
  bookingMaxAdvanceDays: number
  bookingAutoConfirm: boolean
}

function clean(value: string | null) {
  return value?.trim() || null
}

export async function updateSiteSettings(input: SiteSettingsInput) {
  await requireAdmin()

  const siteName = input.siteName.trim()
  if (siteName.length < 2) {
    throw new Error("Nazwa serwisu musi mieć co najmniej 2 znaki.")
  }
  if (!/^[A-Z]{3}$/.test(input.currency)) {
    throw new Error("Waluta musi być trzyliterowym kodem, np. PLN.")
  }
  if (input.bookingMinLeadHours < 0 || input.bookingMinLeadHours > 720) {
    throw new Error("Wyprzedzenie musi mieścić się między 0 a 720 godzinami.")
  }
  if (input.bookingMaxAdvanceDays < 1 || input.bookingMaxAdvanceDays > 365) {
    throw new Error("Horyzont zapisów musi mieścić się między 1 a 365 dniami.")
  }

  const data = {
    siteName,
    tagline: clean(input.tagline),
    contactEmail: clean(input.contactEmail),
    contactPhone: clean(input.contactPhone),
    contactAddress: clean(input.contactAddress),
    socialFacebook: clean(input.socialFacebook),
    socialInstagram: clean(input.socialInstagram),
    currency: input.currency.toUpperCase(),
    bookingMinLeadHours: input.bookingMinLeadHours,
    bookingMaxAdvanceDays: input.bookingMaxAdvanceDays,
    bookingAutoConfirm: input.bookingAutoConfirm,
  }

  await prisma.siteSettings.upsert({
    where: { id: "settings" },
    update: data,
    create: { id: "settings", ...data },
  })

  // Nazwa serwisu siedzi w sidebarze, więc odświeżamy cały panel.
  revalidatePath("/dashboard", "layout")
}
