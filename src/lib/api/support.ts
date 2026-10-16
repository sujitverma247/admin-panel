import { api, ApiError, NetworkError } from "@/lib/api/client"

export type TicketStatus = "open" | "waiting" | "closed"
export type TicketPriority = "normal" | "high"
export type TicketAuthor = "customer" | "staff"

export type TicketRow = {
  id: number
  publicId: string
  customerId: number
  customerEmail: string
  customerName: string
  productId: number | null
  productName: string
  brandId: number | null
  websiteName: string
  licenseId: number | null
  subject: string
  status: TicketStatus | string
  priority: TicketPriority | string
  messageCount: number
  createdAt: string
  updatedAt: string
}

export type TicketMessage = {
  id: number
  author: TicketAuthor | string
  authorName: string
  body: string
  createdAt: string
}

export type TicketDetail = TicketRow & {
  phone: string
  street: string
  city: string
  region: string
  postalCode: string
  country: string
  address: string
  websiteUrl: string
  licenseKey: string | null
  ip: string
  device: string
  language: string
  timezone: string
  screen: string
  geo: string
  isp: string
  mail: string
  adminEmailedAt: string | null
  customerEmailedAt: string | null
  issue: string
  messages: TicketMessage[]
}

export type TicketListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | TicketStatus
  priority?: "all" | TicketPriority
  customerId?: number
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type TicketListResponse = {
  tickets: TicketRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; open: number; waiting: number; closed: number }
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function ticketsQuery(params: TicketListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.priority && params.priority !== "all") search.set("priority", params.priority)
  if (params.customerId && params.customerId > 0) search.set("customerId", String(params.customerId))
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/tickets?${search.toString()}`
}

export function listTickets(token: string, params: TicketListQuery = {}, signal?: AbortSignal) {
  return api<TicketListResponse>(ticketsQuery(params), { token, signal })
}

export function getTicket(token: string, id: number, signal?: AbortSignal) {
  return api<{ ticket: TicketDetail }>(`/admin/tickets/${id}`, { token, signal })
}

export function replyTicket(token: string, id: number, body: string) {
  return api<{ ticket: TicketDetail }>("/admin/tickets/reply", { method: "POST", token, body: { id, body } })
}

export function closeTicket(token: string, id: number) {
  return api<{ ticket: TicketDetail }>("/admin/tickets/close", { method: "POST", token, body: { id } })
}

export function reopenTicket(token: string, id: number) {
  return api<{ ticket: TicketDetail }>("/admin/tickets/reopen", { method: "POST", token, body: { id } })
}

export function toTicketActionError(err: unknown, action: "reply" | "close" | "reopen") {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) {
      if (action === "reply") return "You do not have permission to reply to tickets."
      if (action === "close") return "You do not have permission to close tickets."
      return "You do not have permission to reopen tickets."
    }
    if (err.status === 404 || err.message === "ticket not found") return "Ticket not found."
    if (err.message === "ticket is closed") return "This ticket is closed. Reopen it to reply."
    if (err.message === "missing body") return "Enter a reply before sending."
  }
  if (action === "reply") return "Unable to send this reply."
  if (action === "close") return "Unable to close this ticket."
  return "Unable to reopen this ticket."
}

export function ticketStatusLabel(status: string) {
  return titleWords(status)
}

export function ticketPriorityLabel(priority: string) {
  return titleWords(priority)
}

export function ticketTone(status: string): "success" | "warning" | "danger" | "muted" {
  if (status === "open") return "danger"
  if (status === "waiting") return "warning"
  if (status === "closed") return "muted"
  return "muted"
}

function titleWords(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
