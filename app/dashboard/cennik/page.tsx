import { Info } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { PriceRulesTable } from "@/components/dashboard/pricing/price-rules-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ensureAdminPage } from "@/lib/auth"
import { formatPrice, minutesToTime, plural, WEEKDAYS } from "@/lib/format"
import { groupHourlyEquivalent } from "@/lib/pricing"
import { getTeacherOptions } from "@/lib/queries/availability"
import { getLevels, getSubjects } from "@/lib/queries/catalog"
import { getCourseGroups, seatsTaken } from "@/lib/queries/groups"
import { getPriceRules } from "@/lib/queries/pricing"
import { getSiteSettings } from "@/lib/queries/settings"

export const metadata: Metadata = { title: "Cennik" }

export default async function PricingPage() {
  const ctx = await ensureAdminPage()

  const [rules, levels, subjects, teachers, groups, settings] =
    await Promise.all([
      getPriceRules().catch(() => []),
      getLevels().catch(() => []),
      getSubjects().catch(() => []),
      getTeacherOptions().catch(() => []),
      getCourseGroups(ctx).catch(() => []),
      getSiteSettings(),
    ])

  const currency = settings.currency

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Cennik"
        subtitle="Stawki godzinowe zajęć indywidualnych i abonamenty grupowe"
      />

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Reguła z pustym polem obejmuje wszystko — <em>Matura</em> bez
            wskazanego przedmiotu i nauczyciela dotyczy każdej lekcji na tym
            poziomie. Gdy pasuje więcej niż jedna reguła, wygrywa ta bardziej
            szczegółowa: nauczyciel bije przedmiot, przedmiot bije poziom.
            Dzięki temu podstawowy cennik ustawiasz trzema wpisami, a wyjątek
            dokładasz punktowo.
          </p>
        </div>

        <Panel
          title="Zajęcia indywidualne"
          description="Stawka za godzinę zegarową"
          bodyClassName="p-0 sm:p-0"
        >
          <PriceRulesTable
            currency={currency}
            rules={rules.map((rule) => ({
              id: rule.id,
              levelId: rule.levelId,
              subjectId: rule.subjectId,
              teacherProfileId: rule.teacherProfileId,
              pricePerHour: rule.pricePerHour,
              note: rule.note,
              isActive: rule.isActive,
              levelName: rule.level?.name ?? null,
              subjectName: rule.subject?.name ?? null,
              teacherName: rule.teacherProfile
                ? [
                    rule.teacherProfile.user.firstName,
                    rule.teacherProfile.user.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ")
                : null,
            }))}
            levels={levels.map((level) => ({
              id: level.id,
              name: level.name,
            }))}
            subjects={subjects.map((subject) => ({
              id: subject.id,
              name: subject.name,
            }))}
            teachers={teachers.map((teacher) => ({
              id: teacher.id,
              name:
                [teacher.user.firstName, teacher.user.lastName]
                  .filter(Boolean)
                  .join(" ") || teacher.user.email,
            }))}
          />
        </Panel>

        <Panel
          title="Zajęcia grupowe"
          description={`Abonament miesięczny · rabat ${settings.groupDiscountPercent}% dla uczniów zajęć indywidualnych`}
          actions={
            <Link
              href="/dashboard/grupy"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Zarządzaj grupami
            </Link>
          }
          bodyClassName="p-0 sm:p-0"
        >
          {groups.length === 0 ? (
            <EmptyState
              title="Brak grup"
              description="Ceny grupowe biorą się z konkretnych grup — załóż pierwszą w sekcji Grupy."
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[42rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium sm:px-5">Grupa</th>
                    <th className="px-4 py-3 font-medium">Termin</th>
                    <th className="px-4 py-3 font-medium">Miesięcznie</th>
                    <th className="px-4 py-3 font-medium">W przeliczeniu / h</th>
                    <th className="px-4 py-3 font-medium sm:px-5">Miejsca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groups.map((group) => {
                    const taken = seatsTaken(group)
                    const weekday = WEEKDAYS.find(
                      (day) => day.value === group.weekday
                    )
                    return (
                      <tr key={group.id}>
                        <td className="px-4 py-3 sm:px-5">
                          <p className="font-medium text-foreground">
                            {group.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {group.level?.name ?? "wszystkie poziomy"} ·{" "}
                            {group.meetingsPerMonth}{" "}
                            {plural(
                              group.meetingsPerMonth,
                              "spotkanie",
                              "spotkania",
                              "spotkań"
                            )}{" "}
                            po {group.meetingMinutes} min
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {weekday?.label} {minutesToTime(group.startMin)}
                        </td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                          {formatPrice(group.pricePerMonth, currency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {formatPrice(
                            groupHourlyEquivalent(group),
                            currency
                          )}
                        </td>
                        <td className="px-4 py-3 sm:px-5">
                          <StatusBadge
                            label={`${taken} / ${group.maxSeats}`}
                            tone={
                              taken >= group.maxSeats
                                ? "amber"
                                : taken >= group.minSeats
                                  ? "green"
                                  : "neutral"
                            }
                          />
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
