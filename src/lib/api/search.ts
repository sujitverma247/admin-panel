import { api } from "@/lib/api/client"
import { has, P } from "@/lib/permissions"

export type SearchKind = "customer" | "order" | "key" | "ticket"

export type SearchHit = {
  kind: SearchKind
  id: number
  title: string
  subtitle: string
  to: string
}

const LIMIT = 5

type CustomerRow = { id: number; email: string; displayName: string; isActive: boolean }
type OrderRow = { id: number; publicId: string; customerEmail?: string; status: string; amount: number; currency: string }
type KeyRow = { id: number; key: string; customerEmail: string; planType: string; isRevoked: boolean }
type TicketRow = { id: number; publicId: string; subject: string; status: string; customerEmail?: string }

export async function globalSearch(
  token: string,
  query: string,
  permissions: readonly string[] | undefined,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const jobs: Promise<SearchHit[]>[] = []
  if (has(permissions, P.customerRead)) {
    jobs.push(
      settleHits(
        api<{ customers: CustomerRow[] }>(`/admin/customers?q=${encodeURIComponent(q)}&limit=${LIMIT}`, { token, signal }),
        (body) =>
          body.customers.map((row) => ({
            kind: "customer" as const,
            id: row.id,
            title: row.displayName || row.email,
            subtitle: row.displayName ? row.email : row.isActive ? "Customer" : "Inactive customer",
            to: `/customers?q=${encodeURIComponent(row.email)}`,
          })),
      ),
    )
  }
  if (has(permissions, P.paymentRead)) {
    jobs.push(
      settleHits(
        api<{ orders: OrderRow[] }>(`/admin/orders?q=${encodeURIComponent(q)}&limit=${LIMIT}`, { token, signal }),
        (body) =>
          body.orders.map((row) => ({
            kind: "order" as const,
            id: row.id,
            title: row.publicId.length <= 12 ? row.publicId : row.publicId.slice(0, 12),
            subtitle: [row.customerEmail, row.status].filter(Boolean).join(" · "),
            to: `/orders?q=${encodeURIComponent(row.publicId)}`,
          })),
      ),
    )
  }
  if (has(permissions, P.keyRead)) {
    jobs.push(
      settleHits(
        api<{ keys: KeyRow[] }>(`/admin/keys?q=${encodeURIComponent(q)}&limit=${LIMIT}`, { token, signal }),
        (body) =>
          body.keys.map((row) => ({
            kind: "key" as const,
            id: row.id,
            title: row.key,
            subtitle: [row.customerEmail, row.planType, row.isRevoked ? "revoked" : ""].filter(Boolean).join(" · "),
            to: `/keys?q=${encodeURIComponent(row.key)}`,
          })),
      ),
    )
  }
  if (has(permissions, P.supportRead)) {
    jobs.push(
      settleHits(
        api<{ tickets: TicketRow[] }>(`/admin/tickets?q=${encodeURIComponent(q)}&limit=${LIMIT}`, { token, signal }),
        (body) =>
          body.tickets.map((row) => ({
            kind: "ticket" as const,
            id: row.id,
            title: row.subject,
            subtitle: [row.publicId, row.customerEmail, row.status].filter(Boolean).join(" · "),
            to: `/tickets?q=${encodeURIComponent(row.publicId)}`,
          })),
      ),
    )
  }

  const groups = await Promise.all(jobs)
  return groups.flat()
}

async function settleHits<T>(request: Promise<T>, map: (body: T) => SearchHit[]): Promise<SearchHit[]> {
  try {
    return map(await request)
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    return []
  }
}

export function searchKindLabel(kind: SearchKind) {
  if (kind === "customer") return "Customers"
  if (kind === "order") return "Orders"
  if (kind === "key") return "License keys"
  return "Tickets"
}
