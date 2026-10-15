import { api } from "@/lib/api/client"

export type KeyRow = {
  id: number
  key: string
  customerEmail: string
  planType: string
  isActive: boolean
  isRevoked: boolean
  createdAt: string
}

export function listKeys(token: string, query = "", signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: "100" })
  if (query.trim()) params.set("q", query.trim())
  return api<{ keys: KeyRow[] }>(`/admin/keys?${params}`, { token, signal })
}
