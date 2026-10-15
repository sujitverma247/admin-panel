import { api, apiBlob, ApiError, NetworkError } from "@/lib/api/client"

export type KeyStatus = "unused" | "active" | "expired" | "revoked" | "inactive"

export type KeyRow = {
  id: number
  key: string
  productId: number
  productName?: string
  productSlug?: string
  batchId: number | null
  customerId: number | null
  planType: string
  maxMachines: number
  isActive: boolean
  isRevoked: boolean
  source: string
  customerEmail: string
  notes?: string
  status: KeyStatus
  purchasedAt: string | null
  activatedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export type KeyListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | KeyStatus
  productId?: number
  planType?: string
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type KeyListResponse = {
  keys: KeyRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; unused: number; active: number; revoked: number }
  planTypes: string[]
}

export type IssuedKey = {
  key: string
  email: string
  name: string
  productName: string
  productSlug: string
  planType: string
  maxMachines: number
  purchasedAt: string | null
  activatedAt: string | null
  expiresAt: string | null
}

export type IssueKeyWrite = {
  productId: number
  customerEmail: string
  name?: string
  planType: string
  maxMachines: number
  notes?: string
  locale?: string
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function keysQuery(params: KeyListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.productId && params.productId > 0) search.set("productId", String(params.productId))
  if (params.planType) search.set("planType", params.planType)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/keys?${search.toString()}`
}

export function listKeys(token: string, params: KeyListQuery | string = {}, signal?: AbortSignal) {
  if (typeof params === "string") return api<KeyListResponse>(keysQuery({ q: params, limit: 100 }), { token, signal })
  return api<KeyListResponse>(keysQuery(params), { token, signal })
}

export function issueKey(token: string, body: IssueKeyWrite) {
  return api<IssuedKey>("/admin/keys/issue", { method: "POST", token, body })
}

export function revokeKey(token: string, id: number) {
  return api<{ id: number; isRevoked: boolean }>("/admin/keys/revoke", { method: "POST", token, body: { id } })
}

export type KeyUpdateWrite = {
  id: number
  customerEmail: string
  planType: string
  maxMachines: number
  notes: string
}

export function updateKey(token: string, body: KeyUpdateWrite) {
  return api<{ license: KeyRow }>("/admin/keys/update", { method: "POST", token, body })
}

export async function downloadKeyEvidence(token: string, id: number) {
  const { blob, fileName } = await apiBlob(`/admin/keys/${id}/evidence`, token, undefined, `evidence-${id}.pdf`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName || `evidence-${id}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function toIssueKeyError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to issue keys."
    if (err.message === "missing productId" || err.message === "unknown productId") return "Select an active product."
    if (err.message === "invalid customerEmail") return "Enter a valid customer email."
    if (err.message === "name too long") return "Customer name must be at most 200 characters."
    if (err.message === "notes too long") return "Notes must be at most 1024 characters."
    if (err.message === "key already exists") return "That license key already exists."
  }
  return "Unable to issue the license key."
}

export function toRevokeKeyError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to revoke keys."
    if (err.status === 404 || err.message === "key not found") return "License key not found."
  }
  return "Unable to revoke the license key."
}

export function toUpdateKeyError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to edit keys."
    if (err.status === 404 || err.message === "key not found") return "License key not found."
    if (err.message === "invalid customerEmail") return "Enter a valid customer email."
    if (err.message === "notes too long") return "Notes must be at most 1024 characters."
  }
  return "Unable to update the license key."
}

export function toEvidenceError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to download evidence."
    if (err.status === 404 || err.message === "key not found") return "License key not found."
  }
  return "Unable to generate the evidence document."
}
