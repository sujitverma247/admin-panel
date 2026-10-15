import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { useAuth } from "@/auth/AuthProvider"
import { CopyableText } from "@/components/CopyableText"
import { ListShell } from "@/components/ListShell"
import { StatusBadge } from "@/components/StatusBadge"
import { listTableClass } from "@/components/TableScroll"
import { listCustomers, type CustomerRow } from "@/lib/api/customers"
import { formatDayLabel } from "@/lib/format"

export function CustomersListPage() {
  const { token } = useAuth()
  const [params] = useSearchParams()
  const q = params.get("q") ?? ""
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    listCustomers(token, q, ac.signal)
      .then((body) => {
        setRows(body.customers)
        setError(null)
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load customers.")
      })
    return () => ac.abort()
  }, [token, q])

  return (
    <ListShell
      title="Customers"
      description={q ? `Matches for “${q}”` : "All customers"}
      error={error}
      empty={rows.length === 0 ? (q ? "No customers match this search." : "No customers yet") : null}
    >
      <table className={listTableClass}>
        <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
          <tr>
            <th className="pb-3 pr-4 font-medium">Email</th>
            <th className="pb-3 pr-4 font-medium">Name</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 text-right font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#f0f3f8]">
              <td className="py-3 pr-4 font-medium whitespace-nowrap text-[#0f1f3d]">
                <CopyableText value={row.email} label="email" className="font-medium text-[#0f1f3d]" />
              </td>
              <td className="py-3 pr-4 whitespace-nowrap text-[#5b6478]">{row.displayName || "—"}</td>
              <td className="py-3 pr-4">
                <StatusBadge tone={row.isActive ? "success" : "muted"}>{row.isActive ? "Active" : "Inactive"}</StatusBadge>
              </td>
              <td className="py-3 whitespace-nowrap text-right text-[#8b93a7]">{formatDayLabel(row.createdAt.slice(0, 10))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  )
}
