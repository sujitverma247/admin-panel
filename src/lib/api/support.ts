import { api } from "@/lib/api/client"

export type TicketRow = {
  id: number
  publicId: string
  subject: string
  status: string
  customerEmail?: string
  updatedAt: string
}

export function listTickets(token: string, query = "", signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: "100" })
  if (query.trim()) params.set("q", query.trim())
  return api<{ tickets: TicketRow[] }>(`/admin/tickets?${params}`, { token, signal })
}
