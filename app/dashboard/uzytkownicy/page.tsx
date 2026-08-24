import { UserCog } from "lucide-react"
import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { RoleSelect } from "@/components/dashboard/role-select"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ensureAdminPage } from "@/lib/auth"
import { formatDate, plural } from "@/lib/format"
import { USER_ROLE_LABELS, USER_ROLE_TONES } from "@/lib/labels"
import { getUsers } from "@/lib/queries/people"

export const metadata: Metadata = { title: "Użytkownicy" }

export default async function UsersPage() {
  const ctx = await ensureAdminPage()
  const users = await getUsers().catch(() => [])

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Użytkownicy"
        subtitle={`${users.length} ${plural(users.length, "konto", "konta", "kont")} · rola zapisuje się w Clerku i w bazie`}
      />

      <div className="p-4 sm:p-6">
        <Panel bodyClassName="p-0 sm:p-0">
          {users.length === 0 ? (
            <EmptyState
              icon={<UserCog className="size-6" />}
              title="Brak kont"
              description="Konta pojawią się tu po pierwszym logowaniu przez Clerk."
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[42rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium sm:px-5">
                      Użytkownik
                    </th>
                    <th className="px-4 py-3 font-medium">Obecna rola</th>
                    <th className="px-4 py-3 font-medium">Zmień rolę</th>
                    <th className="px-4 py-3 font-medium sm:px-5">
                      Data rejestracji
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => {
                    const name =
                      [user.firstName, user.lastName]
                        .filter(Boolean)
                        .join(" ") || "—"
                    const isSelf = user.id === ctx.userId

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <p className="font-medium text-foreground">
                            {name}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                (to Ty)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={USER_ROLE_LABELS[user.role]}
                            tone={USER_ROLE_TONES[user.role]}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <RoleSelect
                            userId={user.id}
                            role={user.role}
                            disabled={isSelf}
                            disabledHint="Nie możesz zmienić własnej roli."
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground sm:px-5">
                          {formatDate(user.createdAt)}
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
