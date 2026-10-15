import { api, apiBlob, ApiError, NetworkError } from "@/lib/api/client"

export type InvoiceStatus = "issued" | "void"

export type InvoiceRow = {
  id: number
  publicId: string
  number: string
  orderId: number
  customerId: number
  customerEmail: string
  customerName: string
  productName: string
  status: InvoiceStatus | string
  planType: string
  amount: number
  currency: string
  orderPublicId: string
  gateway: string
  pdfSha256: string
  issuedAt: string
  voidedAt: string | null
}

export type InvoiceDetail = InvoiceRow & {
  brandName: string
  supportEmail: string
  policyVersion: string
}

export type InvoiceListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | InvoiceStatus
  gateway?: string
  customerId?: number
  orderId?: number
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type InvoiceListResponse = {
  invoices: InvoiceRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; issued: number; voided: number }
  gateways: string[]
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function invoicesQuery(params: InvoiceListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  const gateway = params.gateway?.trim()
  if (gateway) search.set("gateway", gateway)
  if (params.customerId && params.customerId > 0) search.set("customerId", String(params.customerId))
  if (params.orderId && params.orderId > 0) search.set("orderId", String(params.orderId))
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/invoices?${search.toString()}`
}

export function listInvoices(token: string, params: InvoiceListQuery = {}, signal?: AbortSignal) {
  return api<InvoiceListResponse>(invoicesQuery(params), { token, signal })
}

export function getInvoice(token: string, id: number, signal?: AbortSignal) {
  return api<{ invoice: InvoiceDetail }>(`/admin/invoices/${id}`, { token, signal })
}

export function voidInvoice(token: string, id: number) {
  return api<{ invoice: InvoiceRow; detail: InvoiceDetail }>("/admin/invoices/void", { method: "POST", token, body: { id } })
}

export async function downloadInvoicePdf(token: string, id: number, number?: string) {
  const fallback = number ? `invoice-${number}.pdf` : `invoice-${id}.pdf`
  const { blob, fileName } = await apiBlob(`/admin/invoices/${id}/pdf`, token, undefined, fallback)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName || fallback
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function toInvoiceActionError(err: unknown, action: "pdf" | "void") {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) {
      return action === "pdf"
        ? "You do not have permission to download invoices."
        : "You do not have permission to cancel invoices."
    }
    if (err.status === 404 || err.message === "invoice not found") return "Invoice not found."
  }
  return action === "pdf" ? "Unable to download this invoice." : "Unable to cancel this invoice."
}

export function invoiceStatusLabel(status: string) {
  if (status === "void") return "Cancelled"
  if (status === "issued") return "Paid"
  if (!status) return status
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export function invoiceTone(status: string): "success" | "warning" | "danger" | "muted" {
  if (status === "issued") return "success"
  if (status === "void") return "danger"
  return "muted"
}
