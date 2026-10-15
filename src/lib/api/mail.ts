import { api, ApiError, NetworkError } from "@/lib/api/client"

export type MailStatus = "pending" | "sent" | "failed"

export type MailRow = {
  id: number
  template: string
  toEmail: string
  toName: string
  fromEmail: string
  subject: string
  locale: string
  status: MailStatus | string
  provider: string
  attempts: number
  lastError: string
  orderId: number | null
  licenseId: number | null
  customerId: number | null
  createdAt: string
  sentAt: string | null
}

export type MailDetail = MailRow & {
  idempotencyKey: string
  fromName: string
  body: string
  providerMessageId: string | null
  productId: number | null
}

export type MailListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | MailStatus
  template?: string
  customerId?: number
  orderId?: number
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type MailListResponse = {
  mail: MailRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; pending: number; sent: number; failed: number }
  templates: string[]
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function mailQuery(params: MailListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  const template = params.template?.trim()
  if (template) search.set("template", template)
  if (params.customerId && params.customerId > 0) search.set("customerId", String(params.customerId))
  if (params.orderId && params.orderId > 0) search.set("orderId", String(params.orderId))
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/mail?${search.toString()}`
}

export function listMail(token: string, params: MailListQuery = {}, signal?: AbortSignal) {
  return api<MailListResponse>(mailQuery(params), { token, signal })
}

export function getMail(token: string, id: number, signal?: AbortSignal) {
  return api<{ mail: MailDetail }>(`/admin/mail/${id}`, { token, signal })
}

export function resendMail(token: string, id: number) {
  return api<{ mail: MailDetail }>("/admin/mail/resend", { method: "POST", token, body: { id } })
}

export function flushMail(token: string) {
  return api<{ sent: number }>("/admin/mail/flush", { method: "POST", token, body: {} })
}

export function toMailActionError(err: unknown, action: "resend" | "flush") {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) {
      return action === "flush"
        ? "You do not have permission to flush the mail queue."
        : "You do not have permission to resend mail."
    }
    if (err.status === 404 || err.message === "mail not found") return "Mail not found."
  }
  return action === "flush" ? "Unable to flush the mail queue." : "Unable to resend this message."
}

export function mailStatusLabel(status: string) {
  return titleWords(status)
}

export function mailTone(status: string): "success" | "warning" | "danger" | "muted" {
  if (status === "sent") return "success"
  if (status === "pending") return "warning"
  if (status === "failed") return "danger"
  return "muted"
}

export function mailTemplateLabel(template: string) {
  if (!template) return "—"
  return template
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function mailLocaleLabel(locale: string) {
  const value = (locale ?? "").trim().toLowerCase()
  if (value === "de" || value.startsWith("de-")) return "German"
  if (value === "en" || value.startsWith("en-") || value.length === 0) return "English"
  return locale
}

function titleWords(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
