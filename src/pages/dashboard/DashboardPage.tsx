import type { ReactNode } from "react"
import { Link } from "react-router"
import {
  ActivityIcon,
  CalendarIcon,
  ChevronDownIcon,
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  HeadphonesIcon,
  KeyRoundIcon,
  MailIcon,
  MessageCircleIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import { PageHeader } from "@/layout/PageHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { cn } from "@/lib/utils"
import {
  activationPoints,
  chartLabels,
  kpis,
  orderBars,
  recentOrders,
  recentTickets,
  systemStatus,
} from "@/pages/dashboard/placeholder"

const kpiIcons = {
  licenses: KeyRoundIcon,
  orders: ShoppingCartIcon,
  customers: UsersIcon,
  tickets: HeadphonesIcon,
  mail: MailIcon,
} as const

const statusIcons = {
  database: DatabaseIcon,
  payments: CreditCardIcon,
  mail: MailIcon,
  telemetry: ActivityIcon,
  support: MessageCircleIcon,
  invoices: FileTextIcon,
} as const

export function DashboardPage() {
  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader
        title="Dashboard"
        description="Overview of your MasterServer license business"
        actions={
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] shadow-[0_1px_2px_rgba(16,42,96,0.04)]"
          >
            <CalendarIcon className="size-4 text-[#8b93a7]" />
            Oct 8, 2026 – Oct 15, 2026
            <ChevronDownIcon className="size-4 text-[#8b93a7]" />
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpiIcons[kpi.key as keyof typeof kpiIcons]
          return (
            <div
              key={kpi.key}
              className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    kpi.iconBg,
                    kpi.iconColor,
                  )}
                >
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
                      kpi.tone === "up" ? "text-[#16a34a]" : "text-[#dc2626]",
                    )}
                  >
                    <TrendingUpIcon className="size-3 shrink-0" />
                    <span className="font-medium">{kpi.delta}</span>
                    <span className="min-w-0 truncate text-[#8b93a7]">vs previous 7 days</span>
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Orders"
          description="Paid orders in the selected period"
        >
          <BarChart values={orderBars} labels={chartLabels} />
        </ChartCard>
        <ChartCard
          title="License Activations"
          description="New activations in the selected period"
        >
          <LineChart values={activationPoints} labels={chartLabels} />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,0.85fr)]">
        <Panel
          title="Recent Orders"
          action={
            <Link to="/orders" className="text-sm font-medium text-[#3b6cff] hover:underline">
              View all →
            </Link>
          }
        >
          <div className="no-scrollbar overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] tracking-wide text-[#8b93a7] uppercase">
              <tr>
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-[#f0f3f8]">
                  <td className="py-3 font-medium text-[#3b6cff]">{order.id}</td>
                  <td className="py-3 text-[#5b6478]">{order.customer}</td>
                  <td className="py-3 text-[#0f1f3d]">{order.amount}</td>
                  <td className="py-3">
                    <StatusBadge tone={order.status === "Paid" ? "success" : "warning"}>
                      {order.status}
                    </StatusBadge>
                  </td>
                  <td className="py-3 text-right text-[#8b93a7]">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Panel>

        <Panel
          title="Recent Support Tickets"
          action={
            <Link to="/tickets" className="text-sm font-medium text-[#3b6cff] hover:underline">
              View all →
            </Link>
          }
        >
          <div className="no-scrollbar overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] tracking-wide text-[#8b93a7] uppercase">
              <tr>
                <th className="pb-3 font-medium">Ticket ID</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-[#f0f3f8]">
                  <td className="py-3 font-medium text-[#3b6cff]">{ticket.id}</td>
                  <td className="py-3 text-[#5b6478]">{ticket.subject}</td>
                  <td className="py-3">
                    <StatusBadge
                      tone={
                        ticket.status === "Open"
                          ? "danger"
                          : ticket.status === "Waiting"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {ticket.status}
                    </StatusBadge>
                  </td>
                  <td className="py-3 text-right text-[#8b93a7]">{ticket.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Panel>

        <Panel title="System Status">
          <ul className="space-y-3">
            {systemStatus.map((item) => {
              const Icon = statusIcons[item.icon]
              return (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  <Icon className="size-4 text-[#8b93a7]" strokeWidth={1.75} />
                  <span className="flex-1 text-[#0f1f3d]">{item.label}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#16a34a]">
                    <span className="size-2 rounded-full bg-[#22c55e]" />
                    Online
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#0f1f3d]">{title}</h2>
          <p className="text-xs text-[#8b93a7]">{description}</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-[#e8edf5] px-2.5 py-1 text-xs text-[#5b6478]"
        >
          Last 7 days
          <ChevronDownIcon className="size-3.5" />
        </button>
      </div>
      {children}
    </div>
  )
}

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
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

function BarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = 50
  const ticks = [50, 40, 30, 20, 10, 0]

  return (
    <div className="flex h-44 min-w-0 gap-3">
      <div className="flex flex-col justify-between pb-6 text-[11px] text-[#9aa3b5]">
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 inset-y-0 mb-6 flex flex-col justify-between">
          {ticks.map((tick) => (
            <div key={tick} className="border-t border-[#eef2f7]" />
          ))}
        </div>
        <div className="relative flex h-full items-end gap-2 pb-6 sm:gap-3">
          {values.map((value, index) => (
            <div key={labels[index]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <div
                className="w-full max-w-9 rounded-t-md bg-[#7ba6ff]"
                style={{ height: `${(value / max) * 100}%` }}
              />
              <span className="mt-2 text-[10px] whitespace-nowrap text-[#9aa3b5] sm:text-[11px]">
                {labels[index]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LineChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = 50
  const width = 560
  const height = 180
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - (value / max) * height
    return { x, y }
  })
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ")
  const area = `${line} L${width} ${height} L0 ${height} Z`
  const ticks = [50, 40, 30, 20, 10, 0]

  return (
    <div className="flex h-44 min-w-0 gap-3">
      <div className="flex flex-col justify-between pb-6 text-[11px] text-[#9aa3b5]">
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 inset-y-0 mb-6 flex flex-col justify-between">
          {ticks.map((tick) => (
            <div key={tick} className="border-t border-[#eef2f7]" />
          ))}
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[calc(100%-1.5rem)] w-full overflow-hidden" aria-hidden="true">
          <defs>
            <linearGradient id="activationFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#activationFill)" />
          <path d={line} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" />
          {points.map((point) => (
            <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" fill="#22c55e" stroke="#fff" strokeWidth="2" />
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-[#9aa3b5] sm:text-[11px]">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
