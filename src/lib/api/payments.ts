import { api, ApiError, NetworkError } from "@/lib/api/client"

export type OrderStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled"

export type OrderRow = {
  id: number
  publicId: string
  customerId: number
  customerEmail: string
  customerName: string
  customerPhone: string
  productId: number
  productName: string
  planType: string
  amount: number
  currency: string
  gateway: string
  status: OrderStatus | string
  licenseId: number | null
  licenseKey?: string | null
  paidAt: string | null
  createdAt: string
}

export type OrderDetail = OrderRow & {
  idempotencyKey: string
  externalPaymentId: string | null
  externalCheckoutId: string | null
  checkoutUrl: string | null
  refundPolicyId: number | null
  updatedAt: string
}

export type OrderListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | OrderStatus
  productId?: number
  gateway?: string
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type OrderListResponse = {
  orders: OrderRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; paid: number; pending: number; refunded: number; other: number }
  gateways: string[]
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function ordersQuery(params: OrderListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.productId && params.productId > 0) search.set("productId", String(params.productId))
  const gateway = params.gateway?.trim()
  if (gateway) search.set("gateway", gateway)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/orders?${search.toString()}`
}

export function listOrders(token: string, params: OrderListQuery | string = {}, signal?: AbortSignal) {
  if (typeof params === "string") return api<OrderListResponse>(ordersQuery({ q: params, limit: 100 }), { token, signal })
  return api<OrderListResponse>(ordersQuery(params), { token, signal })
}

export function getOrder(token: string, id: number, signal?: AbortSignal) {
  return api<{ order: OrderDetail }>(`/admin/orders/${id}`, { token, signal })
}

export function markOrderPaid(token: string, id: number) {
  return api<{ order: OrderDetail }>("/admin/orders/mark-paid", { method: "POST", token, body: { id } })
}

export function toOrderActionError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to mark orders paid."
    if (err.status === 404 || err.message === "order not found") return "Order not found."
    if (err.message === "order refunded") return "This order was already refunded."
  }
  return "Unable to mark this order paid."
}
