import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { useAuth } from "@/auth/AuthProvider"
import { ListShell } from "@/components/ListShell"
import { StatusBadge } from "@/components/StatusBadge"
import { listTickets, type TicketRow } from "@/lib/api/support"
import { formatDayLabel, titleStatus } from "@/lib/format"

export function TicketsListPage() {
  const { token } = useAuth()
  const [params] = useSearchParams()
  const q = params.get("q") ?? ""
  const [rows, setRows] = useState<TicketRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    listTickets(token, q, ac.signal)
      .then((body) => {
        setRows(body.tickets)
        setError(null)
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load tickets.")
      })
    return () => ac.abort()
  }, [token, q])

  return (
    <ListShell
      title="Support Tickets"
      description={q ? `Matches for “${q}”` : "All tickets"}
      error={error}
      empty={rows.length === 0 ? (q ? "No tickets match this search." : "No tickets yet") : null}
    >
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] tracking-wide text-[#8b93a7] uppercase">
            <tr>
              <th className="pb-3 font-medium">Ticket ID</th>
              <th className="pb-3 font-medium">Subject</th>
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 text-right font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#f0f3f8]">
                <td className="py-3 pr-3 font-medium whitespace-nowrap text-[#3b6cff]">
                  {row.publicId.length <= 8 ? row.publicId : row.publicId.slice(0, 8)}
                </td>
                <td className="max-w-[16rem] truncate py-3 pr-3 text-[#0f1f3d]">{row.subject}</td>
                <td className="max-w-[12rem] truncate py-3 pr-3 text-[#5b6478]">{row.customerEmail || "—"}</td>
                <td className="py-3">
                  <StatusBadge
                    tone={row.status === "open" ? "danger" : row.status === "waiting" ? "warning" : "muted"}
                  >
                    {titleStatus(row.status)}
                  </StatusBadge>
                </td>
                <td className="py-3 text-right text-[#8b93a7]">{formatDayLabel(row.updatedAt.slice(0, 10))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ListShell>
  )
}
