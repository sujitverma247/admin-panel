import { api } from "@/lib/api/client"

export type AuditRow = {
  id: number
  userId: number | null
  username: string
  role: string
  action: string
  target: string
  details: string
  ipAddress: string
  createdAt: string
}

export type AuditListQuery = {
  page?: number
  limit?: number
  q?: string
  action?: string
  user?: string
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type AuditListResponse = {
  audit: AuditRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; today: number; logins: number; failed: number }
  actions: string[]
  users: string[]
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function auditQuery(params: AuditListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  const action = params.action?.trim()
  if (action) search.set("action", action)
  const user = params.user?.trim()
  if (user) search.set("user", user)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/audit?${search.toString()}`
}

export function listAudit(token: string, params: AuditListQuery = {}, signal?: AbortSignal) {
  return api<AuditListResponse>(auditQuery(params), { token, signal })
}

export function getAudit(token: string, id: number, signal?: AbortSignal) {
  return api<{ audit: AuditRow }>(`/admin/audit/${id}`, { token, signal })
}

export function auditActionLabel(action: string) {
  if (!action) return action
  return action
    .split(/[.\-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function auditTone(action: string): "success" | "warning" | "danger" | "muted" {
  if (action.includes("failed") || action.endsWith(".delete")) return "danger"
  if (action.includes("revoke") || action.includes("void") || action.includes("deactivate")) return "warning"
  if (action === "auth.login") return "success"
  return "muted"
}

export function auditUsername(row: Pick<AuditRow, "username" | "action" | "target">) {
  if (row.username) return row.username
  if (row.action.startsWith("auth.") && row.target) return row.target
  return ""
}

export function parseAuditTarget(target: string): { to: string; label: string } | null {
  const match = /^(ticket|customer|order|invoice|mail)#(\d+)$/i.exec(target.trim())
  if (!match) return null
  const kind = match[1].toLowerCase()
  const id = match[2]
  const routes: Record<string, string> = {
    ticket: `/tickets/${id}`,
    customer: `/customers/${id}`,
    order: `/orders/${id}`,
    invoice: `/invoices/${id}`,
    mail: `/mail/${id}`,
  }
  const to = routes[kind]
  return to ? { to, label: target } : null
}
