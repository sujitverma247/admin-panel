import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { useAuth } from "@/auth/AuthProvider"
import { CopyableText } from "@/components/CopyableText"
import { ListShell } from "@/components/ListShell"
import { StatusBadge } from "@/components/StatusBadge"
import { listTableClass } from "@/components/TableScroll"
import { listOrders, type OrderRow } from "@/lib/api/payments"
import { formatDayLabel, formatMoney, titleStatus } from "@/lib/format"

export function OrdersListPage() {
  const { token } = useAuth()
  const [params] = useSearchParams()
  const q = params.get("q") ?? ""
  const [rows, setRows] = useState<OrderRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    listOrders(token, q, ac.signal)
      .then((body) => {
        setRows(body.orders)
        setError(null)
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load orders.")
      })
    return () => ac.abort()
  }, [token, q])

  return (
    <ListShell
      title="Orders"
      description={q ? `Matches for “${q}”` : "All orders"}
      error={error}
      empty={rows.length === 0 ? (q ? "No orders match this search." : "No orders yet") : null}
    >
      <table className={listTableClass}>
        <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
          <tr>
            <th className="pb-3 pr-4 font-medium">Order ID</th>
            <th className="pb-3 pr-4 font-medium">Customer</th>
            <th className="pb-3 pr-4 font-medium">Amount</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 text-right font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#f0f3f8]">
              <td className="py-3 pr-4 font-medium whitespace-nowrap text-[#3b6cff]">{row.publicId}</td>
              <td className="py-3 pr-4 whitespace-nowrap text-[#5b6478]">
                <CopyableText value={row.customerEmail} label="email" />
              </td>
              <td className="py-3 pr-4 whitespace-nowrap text-[#0f1f3d]">{formatMoney(row.amount, row.currency)}</td>
              <td className="py-3 pr-4">
                <StatusBadge tone={row.status === "paid" ? "success" : row.status === "refunded" ? "warning" : "muted"}>
                  {titleStatus(row.status)}
                </StatusBadge>
              </td>
              <td className="py-3 whitespace-nowrap text-right text-[#8b93a7]">{formatDayLabel(row.createdAt.slice(0, 10))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  )
}
