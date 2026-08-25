import type { Metadata } from "next"

import { Sidebar } from "@/components/dashboard/sidebar"
import { ensureDashboardPage } from "@/lib/auth"
import { getSidebarCounts } from "@/lib/queries/dashboard"
import { getUnreadCount } from "@/lib/queries/notifications"
import { getSiteSettingsSafe } from "@/lib/queries/settings"

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s — Panel" },
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await ensureDashboardPage()
  const [settings, counts, unread] = await Promise.all([
    getSiteSettingsSafe(),
    getSidebarCounts(ctx).catch(() => ({ bookings: 0, inquiries: 0 })),
    getUnreadCount(ctx).catch(() => 0),
  ])

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar
        role={ctx.role}
        hasTeacherProfile={Boolean(ctx.teacherProfileId)}
        siteName={settings.siteName}
        userName={ctx.fullName}
        pendingBookings={counts.bookings}
        newInquiries={counts.inquiries}
        unreadNotifications={unread}
      />
      {/* Na md+ treść odsuwamy o szerokość stałego sidebara. */}
      <main className="flex min-h-screen flex-col md:pl-64">{children}</main>
    </div>
  )
}
