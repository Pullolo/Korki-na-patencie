import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { SiteSettingsForm } from "@/components/dashboard/site-settings-form"
import { ensureAdminPage } from "@/lib/auth"
import { getSiteSettings } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Ustawienia" }

export default async function SettingsPage() {
  await ensureAdminPage()
  const settings = await getSiteSettings()

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Ustawienia"
        subtitle="Dane serwisu i domyślne reguły rezerwacji"
      />

      <div className="p-4 sm:p-6">
        <div className="max-w-3xl">
          <SiteSettingsForm
            initial={{
              siteName: settings.siteName,
              tagline: settings.tagline,
              contactEmail: settings.contactEmail,
              contactPhone: settings.contactPhone,
              contactAddress: settings.contactAddress,
              socialFacebook: settings.socialFacebook,
              socialInstagram: settings.socialInstagram,
              currency: settings.currency,
              bookingMinLeadHours: settings.bookingMinLeadHours,
              bookingMaxAdvanceDays: settings.bookingMaxAdvanceDays,
              bookingAutoConfirm: settings.bookingAutoConfirm,
            }}
          />
        </div>
      </div>
    </div>
  )
}
