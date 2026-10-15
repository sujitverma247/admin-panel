import { useEffect, useState, type MouseEvent, type ReactNode } from "react"
import { Link } from "react-router"
import {
  HeadphonesIcon,
  KeyRoundIcon,
  MailIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { PageHeader } from "@/layout/PageHeader"
import { CopyableText } from "@/components/CopyableText"
import { StatusBadge } from "@/components/StatusBadge"
import { listTableClass, TableScroll } from "@/components/TableScroll"
import { overview, type AnalyticsOverview, type AnalyticsQuery } from "@/lib/api/analytics"
import { ApiError, NetworkError } from "@/lib/api/client"
import {
  chartBucketKind,
  formatChartMetric,
  formatChartPointLabel,
  formatCount,
  formatDayLabel,
  formatMoney,
  formatSignedInt,
  formatSignedPct,
  sparseChartLabels,
  titleStatus,
} from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  DashboardRange,
  daysAgoUtc,
  presetQuery,
  todayUtc,
  type RangePreset,
} from "@/pages/dashboard/DashboardRange"

const kpiMeta = [
  { key: "licenses" as const, label: "Total Licenses", icon: KeyRoundIcon, iconBg: "bg-[#e8f0ff]", iconColor: "text-[#3b6cff]" },
  { key: "paidOrders" as const, label: "Paid Orders", icon: ShoppingCartIcon, iconBg: "bg-[#e7f8ee]", iconColor: "text-[#22c55e]" },
  { key: "customers" as const, label: "Customers", icon: UsersIcon, iconBg: "bg-[#fef6e6]", iconColor: "text-[#eab308]" },
  { key: "openTickets" as const, label: "Open Tickets", icon: HeadphonesIcon, iconBg: "bg-[#f3e8ff]", iconColor: "text-[#a855f7]" },
  { key: "pendingMail" as const, label: "Pending Mails", icon: MailIcon, iconBg: "bg-[#fde8e8]", iconColor: "text-[#ef4444]" },
]

export function DashboardPage() {
  const { token } = useAuth()
  const [preset, setPreset] = useState<RangePreset>("7d")
  const [query, setQuery] = useState<AnalyticsQuery>({ days: 7 })
  const [customFrom, setCustomFrom] = useState(daysAgoUtc(7))
  const [customTo, setCustomTo] = useState(todayUtc())
  const [pickingCustom, setPickingCustom] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    overview(token, query, ac.signal)
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setError(toDashboardError(err))
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, query, refreshTick])

  function applyCustomRange() {
    if (!customFrom || !customTo || customFrom > customTo) return
    setPreset("custom")
    setQuery({ from: customFrom, to: customTo })
    setPickingCustom(false)
  }

  function startCustom() {
    if (query.from && query.to) {
      setCustomFrom(query.from)
      setCustomTo(query.to)
    } else {
      const days = query.days ?? 7
      setCustomFrom(daysAgoUtc(days))
      setCustomTo(todayUtc())
    }
    setPickingCustom(true)
  }

  const kpis = data
    ? [
        { ...kpiMeta[0], value: formatCount(data.kpis.licenses.total), delta: formatSignedPct(data.kpis.licenses.deltaPct), up: data.kpis.licenses.deltaPct >= 0 },
        { ...kpiMeta[1], value: formatCount(data.kpis.paidOrders.total), delta: formatSignedPct(data.kpis.paidOrders.deltaPct), up: data.kpis.paidOrders.deltaPct >= 0 },
        { ...kpiMeta[2], value: formatCount(data.kpis.customers.total), delta: formatSignedPct(data.kpis.customers.deltaPct), up: data.kpis.customers.deltaPct >= 0 },
        { ...kpiMeta[3], value: formatCount(data.kpis.openTickets.total), delta: formatSignedInt(data.kpis.openTickets.delta), up: data.kpis.openTickets.delta >= 0 },
        { ...kpiMeta[4], value: formatCount(data.kpis.pendingMail.total), delta: formatSignedInt(data.kpis.pendingMail.delta), up: data.kpis.pendingMail.delta >= 0 },
      ]
    : []

  const labels = data?.series.labels ?? []
  const ticks = sparseChartLabels(labels)

  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader
        title="Dashboard"
        description="Overview of licenses, orders, and support"
        actions={
          <DashboardRange
            preset={preset}
            customFrom={customFrom}
            customTo={customTo}
            pickingCustom={pickingCustom}
            loading={loading}
            onPreset={(next) => {
              setPickingCustom(false)
              setPreset(next)
              setQuery(presetQuery(next))
            }}
            onStartCustom={startCustom}
            onCustomFrom={setCustomFrom}
            onCustomTo={setCustomTo}
            onApplyCustom={applyCustomRange}
            onRefresh={() => {
              if (pickingCustom) applyCustomRange()
              setRefreshTick((n) => n + 1)
            }}
          />
        }
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(kpis.length === 0 ? kpiMeta.map((kpi) => ({ ...kpi, value: "—", delta: "…", up: true })) : kpis).map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.key}
              className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]"
            >
              <div className="flex items-start gap-3">
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", kpi.iconBg, kpi.iconColor)}>
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#8b93a7]">{kpi.label}</p>
                  <p className="mt-0.5 text-[1.55rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">
                    {kpi.value}
                  </p>
                  <p
                    className={cn(
                      "mt-2 flex min-w-0 items-center gap-1 text-[11px]",
                      kpi.up ? "text-[#16a34a]" : "text-[#dc2626]",
                    )}
                  >
                    <TrendingUpIcon className="size-3 shrink-0" />
                    <span className="font-medium">{kpi.delta}</span>
                    <span className="min-w-0 truncate text-[#8b93a7]">vs previous period</span>
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Orders" description="Paid orders in the selected period">
          <BarChart values={data?.series.paidOrders ?? []} labels={labels} ticks={ticks} metric="paid order" />
        </ChartCard>
        <ChartCard title="License Activations" description="New activations in the selected period">
          <LineChart values={data?.series.activations ?? []} labels={labels} ticks={ticks} metric="activation" />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Recent Orders"
          action={
            <Link to="/orders" className="text-sm font-medium text-[#3b6cff] hover:underline">
              View all →
            </Link>
          }
        >
          <TableScroll className="max-h-72 flex-none">
            <table className={listTableClass}>
              <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Order ID</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders.length ?? 0) === 0 ? (
                  <tr>
                    <td className="border-t border-[#f0f3f8] py-6 text-[#8b93a7]" colSpan={5}>
                      {loading ? "Loading…" : "No orders yet"}
                    </td>
                  </tr>
                ) : (
                  data!.recentOrders.map((order) => (
                    <tr key={order.publicId} className="border-t border-[#f0f3f8]">
                      <td className="py-3 pr-4 font-medium whitespace-nowrap text-[#3b6cff]">{order.publicId}</td>
                      <td className="py-3 pr-4 whitespace-nowrap text-[#5b6478]">
                        <CopyableText value={order.customerEmail} label="email" />
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-[#0f1f3d]">{formatMoney(order.amount, order.currency)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge tone={order.status === "paid" ? "success" : "warning"}>
                          {titleStatus(order.status)}
                        </StatusBadge>
                      </td>
                      <td className="py-3 whitespace-nowrap text-right text-[#8b93a7]">{formatDayLabel(order.createdAt.slice(0, 10))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScroll>
        </Panel>

        <Panel
          title="Recent Support Tickets"
          action={
            <Link to="/tickets" className="text-sm font-medium text-[#3b6cff] hover:underline">
              View all →
            </Link>
          }
        >
          <TableScroll className="max-h-72 flex-none">
            <table className={listTableClass}>
              <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Ticket ID</th>
                  <th className="pb-3 pr-4 font-medium">Subject</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentTickets.length ?? 0) === 0 ? (
                  <tr>
                    <td className="border-t border-[#f0f3f8] py-6 text-[#8b93a7]" colSpan={4}>
                      {loading ? "Loading…" : "No tickets yet"}
                    </td>
                  </tr>
                ) : (
                  data!.recentTickets.map((ticket) => (
                    <tr key={ticket.publicId} className="border-t border-[#f0f3f8]">
                      <td className="py-3 pr-4 font-medium whitespace-nowrap text-[#3b6cff]">{ticket.publicId}</td>
                      <td className="py-3 pr-4 whitespace-nowrap text-[#5b6478]">{ticket.subject}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge
                          tone={
                            ticket.status === "open" ? "danger" : ticket.status === "waiting" ? "warning" : "muted"
                          }
                        >
                          {titleStatus(ticket.status)}
                        </StatusBadge>
                      </td>
                      <td className="py-3 whitespace-nowrap text-right text-[#8b93a7]">{formatDayLabel(ticket.updatedAt.slice(0, 10))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScroll>
        </Panel>
      </div>
    </div>
  )
}

function toDashboardError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError && err.status === 401) return "Your session expired. Sign in again."
  if (err instanceof ApiError && err.status === 403) return "You do not have access to analytics."
  return "Unable to load dashboard data."
}

function ChartCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="min-w-0 overflow-visible rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#0f1f3d]">{title}</h2>
        <p className="text-xs text-[#8b93a7]">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#0f1f3d]">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function chartScale(values: number[]) {
  const peak = Math.max(1, ...values, 0)
  const step = Math.max(1, Math.ceil(peak / 4))
  const max = step * 4
  return { max, ticks: [max, max - step, max - 2 * step, max - 3 * step, 0] }
}

function ChartAxisLabels({ ticks }: { ticks: (string | null)[] }) {
  const axis = ticks.length > 0 ? ticks : [null]
  return (
    <div className="relative mt-1 h-4">
      {axis.map((label, index) => {
        if (!label) return null
        const last = axis.length - 1
        const left = axis.length === 1 ? 50 : ((index + 0.5) / axis.length) * 100
        const transform = index === 0 ? "translateX(0)" : index === last ? "translateX(-100%)" : "translateX(-50%)"
        return (
          <span
            key={index}
            className="absolute top-0 text-[10px] whitespace-nowrap text-[#9aa3b5]"
            style={{ left: `${left}%`, transform }}
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}

function ChartTooltip({
  index,
  count,
  label,
  value,
  metric,
}: {
  index: number
  count: number
  label: string
  value: number
  metric: string
}) {
  const left = count <= 1 ? 50 : ((index + 0.5) / count) * 100
  const transform = index === 0 ? "translateX(0)" : index === count - 1 ? "translateX(-100%)" : "translateX(-50%)"
  return (
    <div
      data-chart-tooltip=""
      className="pointer-events-none absolute top-1 z-20 min-w-[7.5rem] rounded-lg bg-[#0f1f3d] px-2.5 py-1.5 shadow-[0_8px_20px_rgba(15,31,61,0.28)]"
      style={{ left: `${left}%`, transform }}
    >
      <p className="text-[10px] leading-tight text-white/70">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-white">{formatChartMetric(value, metric)}</p>
    </div>
  )
}

function BarChart({
  values,
  labels,
  ticks,
  metric,
}: {
  values: number[]
  labels: string[]
  ticks: (string | null)[]
  metric: string
}) {
  const { max, ticks: yTicks } = chartScale(values)
  const count = Math.max(labels.length, values.length, ticks.length, 1)
  const dense = count > 14
  const kind = chartBucketKind(labels)
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className="flex h-44 min-w-0 gap-3">
      <div className="flex flex-col justify-between pb-6 text-[11px] text-[#9aa3b5]">
        {yTicks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1" onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-0 inset-y-0 mb-6 flex flex-col justify-between">
          {yTicks.map((tick) => (
            <div key={tick} className="border-t border-[#eef2f7]" />
          ))}
        </div>
        <div className={cn("relative flex h-[calc(100%-1.5rem)] items-end", dense ? "gap-px" : "gap-1.5 sm:gap-2")}>
          {Array.from({ length: count }, (_, index) => {
            const value = values[index] ?? 0
            const pointLabel = formatChartPointLabel(labels[index] ?? "", kind)
            return (
              <div
                key={index}
                className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-t-sm"
                role="img"
                aria-label={`${pointLabel}: ${formatChartMetric(value, metric)}`}
                onMouseEnter={() => setHover(index)}
                onFocus={() => setHover(index)}
                onClick={() => setHover(index)}
              >
                <div
                  className={cn(
                    "w-full max-w-9 rounded-t-md",
                    hover === index ? "bg-[#3b6cff]" : "bg-[#7ba6ff]",
                    value === 0 && "min-h-0",
                  )}
                  style={{ height: `${(value / max) * 100}%` }}
                />
              </div>
            )
          })}
        </div>
        {hover != null ? (
          <ChartTooltip
            index={hover}
            count={count}
            label={formatChartPointLabel(labels[hover] ?? "", kind)}
            value={values[hover] ?? 0}
            metric={metric}
          />
        ) : null}
        <ChartAxisLabels ticks={ticks.length === count ? ticks : sparseChartLabels(labels)} />
      </div>
    </div>
  )
}

function LineChart({
  values,
  labels,
  ticks,
  metric,
}: {
  values: number[]
  labels: string[]
  ticks: (string | null)[]
  metric: string
}) {
  const { max, ticks: yTicks } = chartScale(values)
  const width = 560
  const height = 180
  const series = values.length > 0 ? values : [0]
  const kind = chartBucketKind(labels)
  const [hover, setHover] = useState<number | null>(null)
  const points = series.map((value, index) => {
    const x = series.length === 1 ? width / 2 : ((index + 0.5) / series.length) * width
    const y = height - (value / max) * height
    return { x, y, value }
  })
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ")
  const area = `${line} L${points[points.length - 1]?.x ?? width} ${height} L${points[0]?.x ?? 0} ${height} Z`
  const showDots = series.length <= 14
  const active = hover != null ? points[hover] : null

  function onMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = rect.width <= 0 ? 0 : (event.clientX - rect.left) / rect.width
    const index = Math.max(0, Math.min(series.length - 1, Math.floor(ratio * series.length)))
    setHover(index)
  }

  return (
    <div className="flex h-44 min-w-0 gap-3">
      <div className="flex flex-col justify-between pb-6 text-[11px] text-[#9aa3b5]">
        {yTicks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-0 inset-y-0 mb-6 flex flex-col justify-between">
          {yTicks.map((tick) => (
            <div key={tick} className="border-t border-[#eef2f7]" />
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 z-10 flex h-[calc(100%-1.5rem)]">
          {series.map((value, index) => (
            <div
              key={index}
              className="h-full min-w-0 flex-1"
              role="img"
              aria-label={`${formatChartPointLabel(labels[index] ?? "", kind)}: ${formatChartMetric(value, metric)}`}
              onMouseEnter={() => setHover(index)}
              onFocus={() => setHover(index)}
              onClick={() => setHover(index)}
            />
          ))}
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="relative h-[calc(100%-1.5rem)] w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id="activationFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#activationFill)" />
          <path d={line} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" />
          {active ? (
            <line
              x1={active.x}
              x2={active.x}
              y1="0"
              y2={height}
              stroke="#22c55e"
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
          ) : null}
          {showDots
            ? points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={hover === index ? 5 : 4}
                  fill="#22c55e"
                  stroke="#fff"
                  strokeWidth="2"
                />
              ))
            : active ? (
                <circle cx={active.x} cy={active.y} r="5" fill="#22c55e" stroke="#fff" strokeWidth="2" />
              ) : null}
        </svg>
        {hover != null ? (
          <ChartTooltip
            index={hover}
            count={series.length}
            label={formatChartPointLabel(labels[hover] ?? "", kind)}
            value={series[hover] ?? 0}
            metric={metric}
          />
        ) : null}
        <ChartAxisLabels ticks={ticks.length === series.length ? ticks : sparseChartLabels(labels)} />
      </div>
    </div>
  )
}
