"use client"

import { UserButton } from "@clerk/nextjs"
import { GraduationCap, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { visibleGroups, type NavBadge } from "@/components/dashboard/nav-config"
import { USER_ROLE_LABELS } from "@/lib/labels"
import type { UserRole } from "@/lib/generated/prisma/enums"
import { cn } from "@/lib/utils"

export type SidebarProps = {
  role: UserRole
  hasTeacherProfile?: boolean
  siteName: string
  userName: string
  pendingBookings?: number
  newInquiries?: number
  unreadNotifications?: number
}

function badgeCount(
  badge: NavBadge | undefined,
  counts: { bookings: number; inquiries: number; notifications: number }
) {
  if (badge === "bookings") return counts.bookings
  if (badge === "inquiries") return counts.inquiries
  if (badge === "notifications") return counts.notifications
  return 0
}

function SidebarContent({
  role,
  hasTeacherProfile = false,
  siteName,
  userName,
  pendingBookings = 0,
  newInquiries = 0,
  unreadNotifications = 0,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname()
  const groups = visibleGroups(role, hasTeacherProfile)
  const counts = {
    bookings: pendingBookings,
    inquiries: newInquiries,
    notifications: unreadNotifications,
  }

  return (
    <>
      <Link
        href="/"
        className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <GraduationCap className="size-4 text-sidebar-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            {siteName}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">Panel</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                const count = badgeCount(item.badge, counts)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive
                            ? "text-sidebar-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      />
                      <span className="flex-1">{item.name}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold",
                            isActive
                              ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                              : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-1">
          <UserButton />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {userName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {USER_ROLE_LABELS[role]}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:w-64 md:flex-col">
        <SidebarContent {...props} />
      </aside>

      <div className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label="Otwórz menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="size-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">
            {props.siteName}
          </span>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-col bg-sidebar">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent"
              aria-label="Zamknij menu"
            >
              <X className="size-4" />
            </button>
            <SidebarContent
              {...props}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  )
}
