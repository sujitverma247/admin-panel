import { api } from "@/lib/api/client"

export type MachineStatus = "online" | "offline" | "released"

export type MachineRow = {
  id: number
  licenseId: number
  machineId: string
  appVersion: string
  osVersion: string
  ipAddress: string
  seated: boolean
  online: boolean
  key: string
  productId: number
  productName: string
  customerId: number | null
  customerEmail: string
  planType: string
  activatedAt: string
  lastSeenAt: string
  deactivatedAt: string | null
}

export type MachineHeartbeat = {
  id: number
  licenseId: number
  activationId: number
  machineId: string
  appVersion: string
  osVersion: string
  ipAddress: string
  seenAt: string
}

export type MachineListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | MachineStatus
  productId?: number
  licenseId?: number
  machineId?: string
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type MachineListResponse = {
  machines: MachineRow[]
  total: number
  page: number
  limit: number
  staleHours: number
  counts: { total: number; seated: number; online: number; offline: number }
  products: { id: number; name: string }[]
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function machinesQuery(params: MachineListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.productId && params.productId > 0) search.set("productId", String(params.productId))
  if (params.licenseId && params.licenseId > 0) search.set("licenseId", String(params.licenseId))
  const machineId = params.machineId?.trim()
  if (machineId) search.set("machineId", machineId)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/machines?${search.toString()}`
}

export function listMachines(token: string, params: MachineListQuery = {}, signal?: AbortSignal) {
  return api<MachineListResponse>(machinesQuery(params), { token, signal })
}

export function getMachine(token: string, id: number, signal?: AbortSignal) {
  return api<{ machine: MachineRow; staleHours: number; heartbeats: MachineHeartbeat[] }>(
    `/admin/machines/${id}`,
    { token, signal },
  )
}

export function machineStatus(row: Pick<MachineRow, "seated" | "online">): MachineStatus {
  if (!row.seated) return "released"
  return row.online ? "online" : "offline"
}

export function machineStatusLabel(status: MachineStatus) {
  if (status === "online") return "Online"
  if (status === "offline") return "Offline"
  return "Released"
}

export function machineTone(status: MachineStatus): "success" | "warning" | "muted" {
  if (status === "online") return "success"
  if (status === "offline") return "warning"
  return "muted"
}
