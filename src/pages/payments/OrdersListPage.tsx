import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { useAuth } from "@/auth/AuthProvider"
import { ListShell } from "@/components/ListShell"
import { StatusBadge } from "@/components/StatusBadge"
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
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] tracking-wide text-[#8b93a7] uppercase">
            <tr>
              <th className="pb-3 font-medium">Order ID</th>
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#f0f3f8]">
                <td className="py-3 pr-3 font-medium whitespace-nowrap text-[#3b6cff]">
                  {row.publicId.length <= 12 ? row.publicId : row.publicId.slice(0, 12)}
                </td>
                <td className="max-w-[14rem] truncate py-3 pr-3 text-[#5b6478]">{row.customerEmail || "—"}</td>
                <td className="py-3 pr-3 whitespace-nowrap text-[#0f1f3d]">{formatMoney(row.amount, row.currency)}</td>
                <td className="py-3">
                  <StatusBadge tone={row.status === "paid" ? "success" : row.status === "refunded" ? "warning" : "muted"}>
                    {titleStatus(row.status)}
                  </StatusBadge>
                </td>
                <td className="py-3 text-right text-[#8b93a7]">{formatDayLabel(row.createdAt.slice(0, 10))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ListShell>
  )
}
