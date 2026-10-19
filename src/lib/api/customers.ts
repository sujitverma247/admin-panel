import { api, ApiError, NetworkError } from "@/lib/api/client"

export type CustomerRow = {
  id: number
  email: string
  displayName: string
  phone: string
  notes: string
  source: string
  isActive: boolean
  acceptedCurrent: boolean
  licenseCount: number
  createdAt: string
  updatedAt: string
}

export type CustomerLicense = {
  id: number
  key: string
  productId: number
  planType: string
  isActive: boolean
  isRevoked: boolean
  activatedAt: string | null
  expiresAt: string | null
}

export type CustomerAcceptance = {
  id: number
  policyVersion: string
  source: string
  acceptedAt: string
}

export type CustomerCheckout = {
  ip: string
  device: string
  os: string
  browser: string
  language: string
  timezone: string
  screen: string
  geo: string
  isp: string
  productSlug: string
  planCode: string
  capturedAt: string
}

export type CustomerDetail = CustomerRow & {
  externalCustomerId: string | null
  licenses: CustomerLicense[]
  acceptances: CustomerAcceptance[]
  checkout?: CustomerCheckout | null
}

export type CustomerListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | "active" | "inactive"
  source?: string
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type CustomerListResponse = {
  customers: CustomerRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; active: number; inactive: number }
  sources: string[]
}

export type CustomerWrite = {
  email: string
  displayName?: string
  phone?: string
  notes?: string
  isActive?: boolean
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function customersQuery(params: CustomerListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  const source = params.source?.trim()
  if (source) search.set("source", source)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/customers?${search.toString()}`
}

export function listCustomers(token: string, params: CustomerListQuery | string = {}, signal?: AbortSignal) {
  if (typeof params === "string") return api<CustomerListResponse>(customersQuery({ q: params, limit: 100 }), { token, signal })
  return api<CustomerListResponse>(customersQuery(params), { token, signal })
}

export function getCustomer(token: string, id: number, signal?: AbortSignal) {
  return api<{ customer: CustomerDetail }>(`/admin/customers/${id}`, { token, signal })
}

export function createCustomer(token: string, body: CustomerWrite) {
  return api<{ customer: CustomerRow }>("/admin/customers", { method: "POST", token, body })
}

export function updateCustomer(token: string, id: number, body: CustomerWrite) {
  return api<{ customer: CustomerRow }>("/admin/customers/update", {
    method: "POST",
    token,
    body: { id, ...body },
  })
}

export function toCustomerError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to change customers."
    if (err.message === "invalid email") return "Enter a valid customer email."
    if (err.message === "email already exists") return "A customer with this email already exists."
    if (err.message === "displayName too long") return "Name must be at most 200 characters."
    if (err.message === "phone too long") return "Phone must be at most 32 characters."
    if (err.message === "notes too long") return "Notes must be at most 1024 characters."
    if (err.message === "source too long") return "Source must be at most 32 characters."
    if (err.message === "customer not found") return "Customer not found."
    if (err.status === 409) return "A customer with this email already exists."
    if (err.status === 404) return "Customer not found."
  }
  return "Unable to save customer."
}
