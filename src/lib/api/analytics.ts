import { api } from "@/lib/api/client"

export type AnalyticsKpiPct = {
  total: number
  current: number
  previous: number
  deltaPct: number
}

export type AnalyticsKpiAbs = {
  total: number
  current: number
  previous: number
  delta: number
}

export type AnalyticsOverview = {
  days: number
  from: string
  to: string
  kpis: {
    licenses: AnalyticsKpiPct
    paidOrders: AnalyticsKpiPct
    customers: AnalyticsKpiPct
    openTickets: AnalyticsKpiAbs
    pendingMail: AnalyticsKpiAbs
  }
  series: {
    labels: string[]
    paidOrders: number[]
    activations: number[]
  }
  recentOrders: {
    id: number
    publicId: string
    customerEmail: string
    amount: number
    currency: string
    status: string
    createdAt: string
    paidAt: string | null
  }[]
  recentTickets: {
    id: number
    publicId: string
    subject: string
    status: string
    updatedAt: string
  }[]
}

export type AnalyticsQuery =
  | { days: number; from?: undefined; to?: undefined }
  | { days?: undefined; from: string; to: string }

export function overview(token: string, query: AnalyticsQuery = { days: 7 }) {
  const params = new URLSearchParams()
  if (query.from && query.to) {
    params.set("from", query.from)
    params.set("to", query.to)
  } else {
    params.set("days", String(query.days ?? 7))
  }
  return api<AnalyticsOverview>(`/admin/analytics/overview?${params.toString()}`, { token })
}
