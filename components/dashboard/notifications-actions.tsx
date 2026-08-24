"use client"

import { CheckCheck } from "lucide-react"
import Link from "next/link"

import { ActionButton } from "@/components/dashboard/action-button"
import { useServerAction } from "@/hooks/use-server-action"
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications"
import { cn } from "@/lib/utils"

export function MarkAllReadButton() {
  const { pending, run } = useServerAction()

  return (
    <ActionButton
      variant="ghost"
      pending={pending}
      icon={<CheckCheck className="size-3.5" />}
      onClick={() => run(() => markAllNotificationsRead())}
    >
      Oznacz wszystkie
    </ActionButton>
  )
}

export type NotificationRowData = {
  id: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  timeLabel: string
}

export function NotificationRow({
  notification,
}: {
  notification: NotificationRowData
}) {
  const { pending, run } = useServerAction()

  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={cn(
            "text-sm",
            notification.read
              ? "text-muted-foreground"
              : "font-medium text-foreground"
          )}
        >
          {!notification.read && (
            <span className="mr-2 inline-block size-1.5 -translate-y-0.5 rounded-full bg-primary" />
          )}
          {notification.title}
        </p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {notification.timeLabel}
        </span>
      </div>
      {notification.message && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {notification.message}
        </p>
      )}
    </>
  )

  return (
    <li
      className={cn(
        "px-4 py-3 transition-colors sm:px-5",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {notification.link ? (
            <Link
              href={notification.link}
              onClick={() =>
                !notification.read &&
                run(() => markNotificationRead(notification.id))
              }
              className="block"
            >
              {body}
            </Link>
          ) : (
            body
          )}
        </div>
        {!notification.read && (
          <ActionButton
            variant="ghost"
            pending={pending}
            onClick={() => run(() => markNotificationRead(notification.id))}
          >
            Przeczytane
          </ActionButton>
        )}
      </div>
    </li>
  )
}
