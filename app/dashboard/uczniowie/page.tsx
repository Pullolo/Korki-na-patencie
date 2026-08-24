import { Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { ensureDashboardPage } from "@/lib/auth"
import { formatDate, plural } from "@/lib/format"
import { getStudents } from "@/lib/queries/people"

export const metadata: Metadata = { title: "Uczniowie" }

export default async function StudentsPage() {
  const ctx = await ensureDashboardPage()
  const students = await getStudents(ctx).catch(() => [])

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Uczniowie"
        subtitle={
          ctx.isAdmin
            ? `${students.length} ${plural(students.length, "konto", "konta", "kont")} z rolą Uczeń`
            : "Uczniowie, którzy mają u Ciebie rezerwacje"
        }
      />

      <div className="p-4 sm:p-6">
        <Panel bodyClassName="p-0 sm:p-0">
          {students.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title="Brak uczniów"
              description="Konta zakładane przez formularz rejestracji dostają rolę Uczeń i trafiają na tę listę."
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium sm:px-5">Uczeń</th>
                    <th className="px-4 py-3 font-medium">Kontakt</th>
                    <th className="px-4 py-3 font-medium">Poziom</th>
                    <th className="px-4 py-3 font-medium">Lekcje</th>
                    <th className="px-4 py-3 font-medium sm:px-5">Dołączył</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => {
                    const name =
                      [student.firstName, student.lastName]
                        .filter(Boolean)
                        .join(" ") || "—"

                    return (
                      <tr
                        key={student.id}
                        className="transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <Link
                            href={`/dashboard/uczniowie/${student.id}`}
                            className="font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            {name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <p>{student.email}</p>
                          {student.phone && (
                            <p className="text-xs">{student.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {student.studentProfile?.level?.name ??
                            student.studentProfile?.schoolClass ??
                            "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {student._count.bookings}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground sm:px-5">
                          {formatDate(student.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
