import { Bell } from "lucide-react"
import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { MarkAllReadButton } from "@/components/dashboard/notifications-actions"
import { NotificationRow } from "@/components/dashboard/notifications-actions"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { ensureDashboardPage } from "@/lib/auth"
import { formatRelativeTime, plural } from "@/lib/format"
import { getNotifications } from "@/lib/queries/notifications"

export const metadata: Metadata = { title: "Powiadomienia" }

export default async function NotificationsPage() {
  const ctx = await ensureDashboardPage()
  const notifications = await getNotifications(ctx).catch(() => [])
  const unread = notifications.filter((item) => !item.read).length

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Powiadomienia"
        subtitle={
          unread === 0
            ? "Wszystko przeczytane"
            : `${unread} ${plural(unread, "nieprzeczytane", "nieprzeczytane", "nieprzeczytanych")}`
        }
        actions={unread > 0 ? <MarkAllReadButton /> : null}
      />

      <div className="p-4 sm:p-6">
        <Panel bodyClassName="p-0 sm:p-0">
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="size-6" />}
              title="Brak powiadomień"
              description="Trafią tu informacje o przypisanych zapytaniach i zmianach uprawnień. Powiadomienia o nowych rezerwacjach ruszą razem z zapisami na stronie."
            />
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={{
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    link: notification.link,
                    read: notification.read,
                    timeLabel: formatRelativeTime(notification.createdAt),
                  }}
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
