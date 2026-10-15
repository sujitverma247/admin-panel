import { api } from "@/lib/api/client"

export type CustomerRow = {
  id: number
  email: string
  displayName: string
  isActive: boolean
  source: string
  createdAt: string
}

export function listCustomers(token: string, query = "", signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: "100" })
  if (query.trim()) params.set("q", query.trim())
  return api<{ customers: CustomerRow[] }>(`/admin/customers?${params}`, { token, signal })
}
