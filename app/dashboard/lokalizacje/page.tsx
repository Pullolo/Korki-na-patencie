import { MapPin } from "lucide-react"
import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { LocationsManager } from "@/components/dashboard/catalog/locations-manager"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { ensureDashboardPage } from "@/lib/auth"
import { personName, plural } from "@/lib/format"
import { getLocationsByTeacher } from "@/lib/queries/catalog"

export const metadata: Metadata = { title: "Lokalizacje" }

export default async function LocationsPage() {
  const ctx = await ensureDashboardPage()
  const all = await getLocationsByTeacher().catch(() => [])

  // Nauczyciel zarządza wyłącznie swoimi miejscami, admin widzi wszystkich.
  const teachers = ctx.isAdmin
    ? all
    : all.filter((teacher) => teacher.id === ctx.teacherProfileId)

  const total = teachers.reduce((sum, t) => sum + t.locations.length, 0)

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Lokalizacje"
        subtitle={
          ctx.isAdmin
            ? `${total} ${plural(total, "miejsce", "miejsca", "miejsc")} u ${teachers.length} ${plural(teachers.length, "nauczyciela", "nauczycieli", "nauczycieli")}`
            : "Miejsca, w których prowadzisz zajęcia"
        }
      />

      <div className="space-y-4 p-4 sm:p-6">
        {teachers.length === 0 ? (
          <Panel bodyClassName="p-0 sm:p-0">
            <EmptyState
              icon={<MapPin className="size-6" />}
              title={
                ctx.isAdmin ? "Brak nauczycieli" : "Brak profilu nauczyciela"
              }
              description={
                ctx.isAdmin
                  ? "Nadaj komuś rolę Nauczyciel w sekcji Użytkownicy — profil utworzy się automatycznie."
                  : "Twoje konto nie ma podpiętego profilu nauczyciela."
              }
            />
          </Panel>
        ) : (
          teachers.map((teacher) => {
            const name = personName(teacher.user)

            return (
              <Panel
                key={teacher.id}
                title={ctx.isAdmin ? name : "Twoje miejsca zajęć"}
                description="Online, u nauczyciela albo z dojazdem do ucznia"
              >
                <LocationsManager
                  teacherProfileId={teacher.id}
                  locations={teacher.locations}
                />
              </Panel>
            )
          })
        )}
      </div>
    </div>
  )
}
