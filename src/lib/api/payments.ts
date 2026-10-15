import { api } from "@/lib/api/client"

export type OrderRow = {
  id: number
  publicId: string
  customerEmail?: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export function listOrders(token: string, query = "", signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: "100" })
  if (query.trim()) params.set("q", query.trim())
  return api<{ orders: OrderRow[] }>(`/admin/orders?${params}`, { token, signal })
}
