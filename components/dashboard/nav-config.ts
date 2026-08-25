import {
  Activity,
  Bell,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  MousePointerClick,
  Navigation,
  Search,
  Settings,
  Star,
  UserCog,
  UserRound,
  Users,
  Users2,
  Wallet,
} from "lucide-react"

import type { UserRole } from "@/lib/generated/prisma/enums"

export type NavBadge = "bookings" | "inquiries" | "notifications"

export type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  badge?: NavBadge
  adminOnly?: boolean
  teacherOnly?: boolean
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const NAVIGATION: NavGroup[] = [
  {
    label: "Przegląd",
    items: [
      { name: "Pulpit", href: "/dashboard", icon: LayoutDashboard },
      {
        name: "Statystyki",
        href: "/dashboard/statystyki",
        icon: ChartNoAxesCombined,
      },
      {
        name: "Ruch na stronie",
        href: "/dashboard/ruch",
        icon: MousePointerClick,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Grafik",
    items: [
      { name: "Kalendarz", href: "/dashboard/kalendarz", icon: CalendarDays },
      {
        name: "Moja dostępność",
        href: "/dashboard/dostepnosc",
        icon: CalendarClock,
      },
      {
        name: "Rezerwacje",
        href: "/dashboard/rezerwacje",
        icon: ClipboardList,
        badge: "bookings",
      },
    ],
  },
  {
    label: "Korepetycje",
    items: [
      {
        name: "Nauczyciele",
        href: "/dashboard/nauczyciele",
        icon: GraduationCap,
        adminOnly: true,
      },
      // Nauczyciel nie zna własnego id, więc dostaje skrót przez przekierowanie.
      {
        name: "Mój profil",
        href: "/dashboard/profil",
        icon: UserRound,
        teacherOnly: true,
      },
      {
        name: "Przedmioty",
        href: "/dashboard/przedmioty",
        icon: BookOpen,
        adminOnly: true,
      },
      {
        name: "Cennik",
        href: "/dashboard/cennik",
        icon: Wallet,
        adminOnly: true,
      },
      // Grupy prowadzi nauczyciel, więc widzi je razem z resztą swojej oferty.
      { name: "Grupy", href: "/dashboard/grupy", icon: Users2 },
      {
        name: "Poziomy",
        href: "/dashboard/poziomy",
        icon: Layers,
        adminOnly: true,
      },
      { name: "Lokalizacje", href: "/dashboard/lokalizacje", icon: MapPin },
    ],
  },
  {
    label: "Uczniowie",
    items: [
      { name: "Uczniowie", href: "/dashboard/uczniowie", icon: Users },
      {
        name: "Zapytania",
        href: "/dashboard/zapytania",
        icon: MessageSquareText,
        badge: "inquiries",
      },
      {
        name: "Opinie",
        href: "/dashboard/opinie",
        icon: Star,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Treści",
    items: [
      {
        name: "Strony",
        href: "/dashboard/strony",
        icon: FileText,
        adminOnly: true,
      },
      {
        name: "Nawigacja",
        href: "/dashboard/nawigacja",
        icon: Navigation,
        adminOnly: true,
      },
      {
        name: "FAQ",
        href: "/dashboard/faq",
        icon: HelpCircle,
        adminOnly: true,
      },
      { name: "SEO", href: "/dashboard/seo", icon: Search, adminOnly: true },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Powiadomienia",
        href: "/dashboard/powiadomienia",
        icon: Bell,
        badge: "notifications",
      },
      {
        name: "Użytkownicy",
        href: "/dashboard/uzytkownicy",
        icon: UserCog,
        adminOnly: true,
      },
      {
        name: "Ustawienia",
        href: "/dashboard/ustawienia",
        icon: Settings,
        adminOnly: true,
      },
      {
        name: "Status",
        href: "/dashboard/status",
        icon: Activity,
        adminOnly: true,
      },
    ],
  },
]

export function visibleGroups(role: UserRole) {
  const isAdmin = role === "ADMIN"
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.adminOnly && !isAdmin) return false
      if (item.teacherOnly && isAdmin) return false
      return true
    }),
  })).filter((group) => group.items.length > 0)
}
