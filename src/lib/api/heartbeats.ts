import { api } from "@/lib/api/client"

export type HeartbeatRow = {
  id: number
  licenseId: number
  activationId: number
  machineId: string
  appVersion: string
  osVersion: string
  ipAddress: string
  seenAt: string
  key: string
  productId: number
  productName: string
  customerEmail: string
}

export type HeartbeatListQuery = {
  page?: number
  limit?: number
  q?: string
  productId?: number
  licenseId?: number
  activationId?: number
  machineId?: string
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type HeartbeatListResponse = {
  heartbeats: HeartbeatRow[]
  total: number
  page: number
  limit: number
  retentionDays: number
  counts: { total: number; last24h: number; lastHour: number; uniqueMachines: number }
  products: { id: number; name: string }[]
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function heartbeatsQuery(params: HeartbeatListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.productId && params.productId > 0) search.set("productId", String(params.productId))
  if (params.licenseId && params.licenseId > 0) search.set("licenseId", String(params.licenseId))
  if (params.activationId && params.activationId > 0) search.set("activationId", String(params.activationId))
  const machineId = params.machineId?.trim()
  if (machineId) search.set("machineId", machineId)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/heartbeats?${search.toString()}`
}

export function listHeartbeats(token: string, params: HeartbeatListQuery = {}, signal?: AbortSignal) {
  return api<HeartbeatListResponse>(heartbeatsQuery(params), { token, signal })
}
