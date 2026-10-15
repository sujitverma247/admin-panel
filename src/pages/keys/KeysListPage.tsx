import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { useAuth } from "@/auth/AuthProvider"
import { ListShell } from "@/components/ListShell"
import { StatusBadge } from "@/components/StatusBadge"
import { listKeys, type KeyRow } from "@/lib/api/keys"
import { formatDayLabel } from "@/lib/format"

export function KeysListPage() {
  const { token } = useAuth()
  const [params] = useSearchParams()
  const q = params.get("q") ?? ""
  const [rows, setRows] = useState<KeyRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    listKeys(token, q, ac.signal)
      .then((body) => {
        setRows(body.keys)
        setError(null)
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load keys.")
      })
    return () => ac.abort()
  }, [token, q])

  return (
    <ListShell
      title="License Keys"
      description={q ? `Matches for “${q}”` : "All license keys"}
      error={error}
      empty={rows.length === 0 ? (q ? "No keys match this search." : "No keys yet") : null}
    >
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] tracking-wide text-[#8b93a7] uppercase">
            <tr>
              <th className="pb-3 font-medium">Key</th>
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Plan</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 text-right font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#f0f3f8]">
                <td className="py-3 pr-3 font-medium whitespace-nowrap text-[#0f1f3d]">{row.key}</td>
                <td className="max-w-[14rem] truncate py-3 pr-3 text-[#5b6478]">{row.customerEmail || "—"}</td>
                <td className="py-3 pr-3 text-[#5b6478]">{row.planType}</td>
                <td className="py-3">
                  <StatusBadge tone={row.isRevoked ? "danger" : row.isActive ? "success" : "muted"}>
                    {row.isRevoked ? "Revoked" : row.isActive ? "Active" : "Inactive"}
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
