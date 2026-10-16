import { api, ApiError, NetworkError } from "@/lib/api/client"

export type AdminUserRow = {
  id: number
  username: string
  role: string
  displayName: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export type AdminUserListQuery = {
  page?: number
  limit?: number
  q?: string
  role?: string
  status?: "all" | "active" | "inactive"
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type AdminUserListResponse = {
  users: AdminUserRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; active: number; inactive: number; admins: number }
  roles: string[]
}

export type AdminUserWrite = {
  username?: string
  password?: string
  role?: string
  displayName?: string
  isActive?: boolean
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function usersQuery(params: AdminUserListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  const role = params.role?.trim()
  if (role) search.set("role", role)
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/users?${search.toString()}`
}

export function listUsers(token: string, params: AdminUserListQuery = {}, signal?: AbortSignal) {
  return api<AdminUserListResponse>(usersQuery(params), { token, signal })
}

export function getUser(token: string, id: number, signal?: AbortSignal) {
  return api<{ user: AdminUserRow }>(`/admin/users/${id}`, { token, signal })
}

export function createUser(token: string, body: Required<Pick<AdminUserWrite, "username" | "password">> & AdminUserWrite) {
  return api<{ user: AdminUserRow }>("/admin/users", { method: "POST", token, body })
}

export function updateUser(token: string, id: number, body: AdminUserWrite) {
  return api<{ user: AdminUserRow }>("/admin/users/update", {
    method: "POST",
    token,
    body: { id, ...body },
  })
}

export function roleLabel(role: string) {
  if (!role) return role
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

export function toUserError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to manage admin users."
    if (err.message === "missing username or password") return "Username and password are required."
    if (err.message === "invalid username") return "Username can only use letters, numbers, dots, hyphens, and underscores."
    if (err.message === "password too short") return "Password must be at least 8 characters."
    if (err.message === "password too long") return "Password must be at most 128 characters."
    if (err.message === "displayName too long") return "Name must be at most 200 characters."
    if (err.message === "username already exists") return "That username is already taken."
    if (err.message === "unknown role") return "Choose a valid role."
    if (err.message === "cannot deactivate yourself") return "You cannot deactivate your own account."
    if (err.message === "cannot remove the last admin") return "Keep at least one active admin user."
    if (err.message === "user not found") return "Admin user not found."
    if (err.status === 409) return "That username is already taken."
    if (err.status === 404) return "Admin user not found."
  }
  return "Unable to save admin user."
}
