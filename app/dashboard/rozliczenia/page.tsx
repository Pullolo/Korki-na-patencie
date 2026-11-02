import { CalendarCheck, HandCoins, Scale, Wallet } from "lucide-react"
import type { Metadata } from "next"

import { Header } from "@/components/dashboard/header"
import { EmptyState, Panel } from "@/components/dashboard/panel"
import { AddPastLesson } from "@/components/dashboard/settlements/add-past-lesson"
import { ExportButton } from "@/components/dashboard/settlements/export-button"
import {
  PaidOutCell,
  PaymentMethodCell,
  PayoutCell,
} from "@/components/dashboard/settlements/lesson-cells"
import { PayoutRateRow } from "@/components/dashboard/settlements/payout-rate-row"
import { PeriodPicker } from "@/components/dashboard/settlements/period-picker"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import {
  ALL_TEACHERS,
  TeacherPicker,
} from "@/components/dashboard/teacher-picker"
import { ensureDashboardPage } from "@/lib/auth"
import { formatDate, formatPrice, formatTime, plural } from "@/lib/format"
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES } from "@/lib/labels"
import { getBookingFormOptions } from "@/lib/queries/bookings"
import { getSiteSettingsSafe } from "@/lib/queries/settings"
import {
  getPayoutRates,
  getSettlement,
  periodOptions,
  resolvePeriod,
} from "@/lib/queries/settlements"

export const metadata: Metadata = { title: "Rozliczenia" }

const EMPTY = {
  rows: [],
  byStudent: [],
  byTeacher: [],
  totals: {
    lessons: 0,
    revenue: 0,
    payout: 0,
    margin: 0,
    paidOut: 0,
    toPay: 0,
    paidLessons: 0,
    withoutPayout: 0,
    withoutPaymentMethod: 0,
    online: 0,
    cash: 0,
  },
}

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    miesiac?: string | string[]
    nauczyciel?: string | string[]
  }>
}) {
  const ctx = await ensureDashboardPage()
  const params = await searchParams

  const period = resolvePeriod(single(params.miesiac))
  const requestedTeacher = single(params.nauczyciel)

  // Nauczyciel nie wybiera, czyje rozliczenie widzi — `teacherScope()`
  // w zapytaniu i tak przypnie mu własny profil.
  const selectedTeacher = ctx.isAdmin
    ? (requestedTeacher ?? ALL_TEACHERS)
    : null
  const teacherFilter =
    selectedTeacher && selectedTeacher !== ALL_TEACHERS ? selectedTeacher : null

  const [settlement, settings, rates, formOptions] = await Promise.all([
    getSettlement(ctx, { period, teacherProfileId: teacherFilter }).catch(
      () => EMPTY
    ),
    getSiteSettingsSafe(),
    getPayoutRates(ctx).catch(() => []),
    getBookingFormOptions(ctx).catch(() => null),
  ])

  const { totals, rows } = settlement
  const currency = settings.currency
  const money = (value: number | null) => formatPrice(value, currency)

  const summary = [
    { label: "Liczba lekcji", value: String(totals.lessons) },
    { label: "TOTAL PROFIT", value: money(totals.revenue) },
    { label: "MOJE", value: money(totals.payout) },
    { label: "WYPŁACONE", value: money(totals.paidOut) },
    { label: "DO WYPŁATY", value: money(totals.toPay), accent: true },
    { label: "Marża łącznie", value: money(totals.margin) },
  ]

  return (
    <div className="flex w-full min-w-0 flex-col">
      <Header
        title="Rozliczenia"
        subtitle={`${period.label} · ${
          ctx.isAdmin
            ? teacherFilter
              ? "wybrany nauczyciel"
              : "wszyscy nauczyciele"
            : "Twoje lekcje"
        } · potwierdzone i odbyte`}
        actions={
          <ExportButton period={period.key} teacherProfileId={teacherFilter} />
        }
      />

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker
            basePath="/dashboard/rozliczenia"
            options={periodOptions()}
            selected={period.key}
            extraParams={{ nauczyciel: selectedTeacher ?? undefined }}
          />
          {ctx.isAdmin && rates.length > 0 && (
            <TeacherPicker
              basePath="/dashboard/rozliczenia"
              selectedId={selectedTeacher ?? ALL_TEACHERS}
              teachers={rates.map((rate) => ({
                id: rate.id,
                name: rate.name,
              }))}
              allowAll
              extraParams={{ miesiac: period.key }}
            />
          )}
        </div>

        {/* Lekcja, która się odbyła, a nigdy nie przeszła przez rezerwację —
            w arkuszu był to zwykły nowy wiersz, więc wpisuje się ją tutaj,
            a nie okrężną drogą przez „Rezerwacje". */}
        {formOptions && (
          <AddPastLesson
            options={formOptions}
            rates={rates}
            defaultTeacherId={teacherFilter ?? ctx.teacherProfileId}
            currency={currency}
          />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Lekcje w okresie"
            value={String(totals.lessons)}
            hint={`${totals.paidLessons} ${plural(totals.paidLessons, "rozliczona", "rozliczone", "rozliczonych")}`}
            icon={<CalendarCheck className="size-4 text-blue-600" />}
            iconBg="bg-blue-500/10"
          />
          <StatCard
            title="Przychód (TOTAL PROFIT)"
            value={money(totals.revenue)}
            hint="Suma cen lekcji"
            icon={<Wallet className="size-4 text-emerald-600" />}
            iconBg="bg-emerald-500/10"
          />
          <StatCard
            title="Do wypłaty"
            value={money(totals.toPay)}
            hint={`Wypłacone już ${money(totals.paidOut)}`}
            icon={<HandCoins className="size-4 text-amber-600" />}
            iconBg="bg-amber-500/10"
          />
          <StatCard
            title="Marża łącznie"
            value={money(totals.margin)}
            hint="Cena minus część nauczyciela"
            icon={<Scale className="size-4 text-violet-600" />}
            iconBg="bg-violet-500/10"
          />
        </div>

        {totals.withoutPayout > 0 && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            {totals.withoutPayout}{" "}
            {plural(totals.withoutPayout, "lekcja", "lekcje", "lekcji")} bez
            wpisanej części nauczyciela — sumy „MOJE”, „DO WYPŁATY” i „Marża
            łącznie” są o tyle niepełne. Uzupełnij kwoty w kolumnie „Moje” albo
            ustaw stawkę godzinową nauczyciela.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title="Podsumowanie"
            description="Układ z arkusza, który to zastępuje"
            bodyClassName="p-0 sm:p-0"
          >
            <dl className="divide-y divide-border">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:px-5"
                >
                  <dt className="text-xs text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd
                    className={
                      item.accent
                        ? "text-sm font-semibold text-amber-700 tabular-nums dark:text-amber-400"
                        : "text-sm font-medium text-foreground tabular-nums"
                    }
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel
            title="Płatności"
            description="Jak uczniowie zapłacili"
            bodyClassName="p-0 sm:p-0"
          >
            <dl className="divide-y divide-border">
              {[
                { label: "Online", value: totals.online },
                { label: "Gotówka", value: totals.cash },
                { label: "Nie wiadomo", value: totals.withoutPaymentMethod },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:px-5"
                >
                  <dt className="text-xs text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground tabular-nums">
                    {item.value}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {plural(item.value, "lekcja", "lekcje", "lekcji")}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel
            title="Per uczeń"
            description="Lekcje i kwoty w tym okresie"
            bodyClassName="p-0 sm:p-0"
          >
            {settlement.byStudent.length === 0 ? (
              <EmptyState title="Brak lekcji w tym okresie" />
            ) : (
              <ul className="divide-y divide-border">
                {settlement.byStudent.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.lessons}{" "}
                        {plural(item.lessons, "lekcja", "lekcje", "lekcji")} ·
                        moje razem {money(item.payout)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-foreground tabular-nums">
                      {money(item.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel
          title="Lekcje"
          description="Kwoty i znacznik wypłaty zmieniasz w miejscu"
          bodyClassName="p-0 sm:p-0"
        >
          {rows.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="size-6" />}
              title="Brak lekcji w tym okresie"
              description="Rozliczenie pokazuje lekcje potwierdzone i odbyte. Zmień okres u góry albo wpisz lekcję w „Rezerwacjach”."
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[58rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium sm:px-5">Data</th>
                    <th className="px-4 py-3 font-medium">Uczeń</th>
                    {ctx.isAdmin && (
                      <th className="px-4 py-3 font-medium">Nauczyciel</th>
                    )}
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Cena</th>
                    <th className="px-4 py-3 font-medium">Moje</th>
                    <th className="px-4 py-3 text-right font-medium">Marża</th>
                    <th className="px-4 py-3 font-medium">Płatność</th>
                    <th className="px-4 py-3 font-medium sm:px-5">
                      Wypłacone?
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-2 whitespace-nowrap sm:px-5">
                        <p className="text-foreground">
                          {formatDate(row.startsAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(row.startsAt)}
                        </p>
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-foreground">{row.student}</p>
                      </td>
                      {ctx.isAdmin && (
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                          {row.teacher}
                        </td>
                      )}
                      <td className="px-4 py-2">
                        <StatusBadge
                          label={BOOKING_STATUS_LABELS[row.status]}
                          tone={BOOKING_STATUS_TONES[row.status]}
                        />
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap text-muted-foreground tabular-nums">
                        {money(row.price)}
                      </td>
                      <td className="px-4 py-2">
                        <PayoutCell bookingId={row.id} payout={row.payout} />
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap text-muted-foreground tabular-nums">
                        {money(row.margin)}
                      </td>
                      <td className="px-4 py-2">
                        <PaymentMethodCell
                          bookingId={row.id}
                          method={row.paymentMethod}
                        />
                      </td>
                      <td className="px-4 py-2 sm:px-5">
                        <PaidOutCell bookingId={row.id} paidOut={row.paidOut} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {ctx.isAdmin && settlement.byTeacher.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              title="Per nauczyciel"
              description="Ile kto miał lekcji i ile mu się należy"
              bodyClassName="p-0 sm:p-0"
            >
              <ul className="divide-y divide-border">
                {settlement.byTeacher.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.lessons}{" "}
                        {plural(item.lessons, "lekcja", "lekcje", "lekcji")} ·
                        przychód {money(item.revenue)} · marża{" "}
                        {money(item.margin)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-foreground tabular-nums">
                      {money(item.payout)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel
              title="Stawki nauczycieli"
              description="Ile z ceny lekcji trafia do nauczyciela — liczy się od następnej zapisanej lekcji"
              bodyClassName="px-4 py-2 sm:px-5"
            >
              <div className="divide-y divide-border">
                {rates.map((rate) => (
                  <PayoutRateRow
                    key={rate.id}
                    teacherProfileId={rate.id}
                    name={rate.name}
                    payoutPerHour={rate.payoutPerHour}
                    currencyLabel={currency}
                  />
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}
