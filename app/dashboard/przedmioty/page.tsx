import { BookOpen } from "lucide-react"
import type { Metadata } from "next"

import { SubjectsTable } from "@/components/dashboard/catalog/subjects-table"
import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { ensureAdminPage } from "@/lib/auth"
import { plural } from "@/lib/format"
import { getSubjects } from "@/lib/queries/catalog"

export const metadata: Metadata = { title: "Przedmioty" }

export default async function SubjectsPage() {
  await ensureAdminPage()
  const subjects = await getSubjects().catch(() => [])

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Przedmioty"
        subtitle={`${subjects.length} ${plural(subjects.length, "przedmiot", "przedmioty", "przedmiotów")} w ofercie · stawki ustawiasz w sekcji Cennik`}
      />

      <div className="p-4 sm:p-6">
        <Panel bodyClassName="p-0 sm:p-0">
          {subjects.length === 0 ? (
            <div>
              <EmptyState
                icon={<BookOpen className="size-6" />}
                title="Brak przedmiotów"
                description="Dodaj pierwszy przedmiot — bez tego nauczyciele nie mają czego uczyć."
              />
              <SubjectsTable subjects={[]} />
            </div>
          ) : (
            <SubjectsTable
             
              subjects={subjects.map((subject) => ({
                id: subject.id,
                name: subject.name,
                slug: subject.slug,
                description: subject.description,
                color: subject.color,
                isActive: subject.isActive,
                order: subject.order,
                teacherCount: subject._count.teacherSubjects,
                bookingCount: subject._count.bookings,
              }))}
            />
          )}
        </Panel>
      </div>
    </div>
  )
}
