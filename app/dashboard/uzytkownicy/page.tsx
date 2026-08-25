import { SearchX, UserCog } from "lucide-react"
import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { RoleSelect } from "@/components/dashboard/role-select"
import { SearchInput } from "@/components/dashboard/search-input"
import {
  DIR_PARAM,
  parseSortDir,
  SORT_PARAM,
  SortHeader,
} from "@/components/dashboard/sort-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TeacherProfileToggle } from "@/components/dashboard/teacher-profile-toggle"
import { ensureAdminPage } from "@/lib/auth"
import { formatDate, plural } from "@/lib/format"
import { USER_ROLE_LABELS, USER_ROLE_TONES } from "@/lib/labels"
import {
  getUsers,
  USER_SORT_KEYS,
  type UserSortKey,
} from "@/lib/queries/people"

export const metadata: Metadata = { title: "Użytkownicy" }

const BASE_PATH = "/dashboard/uzytkownicy"
const SEARCH_PARAM = "szukaj"
const DEFAULT_SORT: UserSortKey = "data"

function parseSort(value: string | string[] | undefined): UserSortKey {
  return USER_SORT_KEYS.includes(value as UserSortKey)
    ? (value as UserSortKey)
    : DEFAULT_SORT
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    szukaj?: string | string[]
    sortuj?: string | string[]
    kierunek?: string | string[]
  }>
}) {
  const ctx = await ensureAdminPage()
  const params = await searchParams

  const search = typeof params.szukaj === "string" ? params.szukaj.trim() : ""
  const sort = parseSort(params.sortuj)
  const dir = parseSortDir(params.kierunek)

  const { users, matching, total } = await getUsers({
    search,
    sort,
    dir,
  }).catch(() => ({ users: [], matching: 0, total: 0 }))

  // Domyślnego sortowania nie wleczemy w URL-u, żeby linki zostały krótkie.
  const isDefaultSort = sort === DEFAULT_SORT && dir === "desc"
  const sortParams = isDefaultSort
    ? {}
    : { [SORT_PARAM]: sort, [DIR_PARAM]: dir }
  const columnProps = {
    activeColumn: sort,
    dir,
    basePath: BASE_PATH,
    params: search ? { [SEARCH_PARAM]: search } : {},
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Użytkownicy"
        subtitle={
          search
            ? `Fraza „${search}” · ${matching} ${plural(matching, "konto", "konta", "kont")} z ${total}`
            : `${total} ${plural(total, "konto", "konta", "kont")} · rola zapisuje się w Clerku i w bazie`
        }
      />

      <div className="space-y-4 p-4 sm:p-6">
        <SearchInput
          basePath={BASE_PATH}
          paramKey={SEARCH_PARAM}
          value={search}
          placeholder="Szukaj po imieniu, nazwisku lub mailu"
          extraParams={sortParams}
          className="w-full sm:max-w-sm"
        />

        <Panel bodyClassName="p-0 sm:p-0">
          {users.length === 0 ? (
            search ? (
              <EmptyState
                icon={<SearchX className="size-6" />}
                title="Brak wyników"
                description={`Żadne konto nie pasuje do frazy „${search}”. Spróbuj samego nazwiska albo fragmentu adresu e-mail.`}
              />
            ) : (
              <EmptyState
                icon={<UserCog className="size-6" />}
                title="Brak kont"
                description="Konta pojawią się tu po pierwszym logowaniu przez Clerk."
              />
            )
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[54rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <SortHeader
                      {...columnProps}
                      label="Użytkownik"
                      column="nazwa"
                      className="sm:px-5"
                    />
                    <SortHeader
                      {...columnProps}
                      label="Obecna rola"
                      column="rola"
                    />
                    <th scope="col" className="px-4 py-3 font-medium">
                      Zmień rolę
                    </th>
                    <SortHeader
                      {...columnProps}
                      label="Profil nauczyciela"
                      column="profil"
                    />
                    <SortHeader
                      {...columnProps}
                      label="Data rejestracji"
                      column="data"
                      defaultDir="desc"
                      className="sm:px-5"
                    />
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
                        <td className="px-4 py-3">
                          <TeacherProfileToggle
                            userId={user.id}
                            role={user.role}
                            profileId={user.teacherProfile?.id ?? null}
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

        {users.length < matching && (
          <p className="text-xs text-muted-foreground">
            Pokazujemy pierwsze {users.length} z {matching} kont — zawęź listę
            wyszukiwarką.
          </p>
        )}
      </div>
    </div>
  )
}
