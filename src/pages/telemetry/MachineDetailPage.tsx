import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeftIcon } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { CopyableText } from "@/components/CopyableText"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, listTableClass, TableScroll } from "@/components/TableScroll"
import {
  getMachine,
  machineStatus,
  machineStatusLabel,
  machineTone,
  type MachineHeartbeat,
  type MachineRow,
} from "@/lib/api/machines"

export function MachineDetailPage() {
  const { id } = useParams()
  const machinePk = Number(id)
  const { token } = useAuth()
  const [entry, setEntry] = useState<MachineRow | null>(null)
  const [heartbeats, setHeartbeats] = useState<MachineHeartbeat[]>([])
  const [staleHours, setStaleHours] = useState(72)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !Number.isInteger(machinePk) || machinePk <= 0) return
    const ac = new AbortController()
    setLoading(true)
    getMachine(token, machinePk, ac.signal)
      .then((body) => {
        setEntry(body.machine)
        setHeartbeats(body.heartbeats ?? [])
        if (body.staleHours > 0) setStaleHours(body.staleHours)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setEntry(null)
        setHeartbeats([])
        setError("Unable to load this machine.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, machinePk])

  if (!Number.isInteger(machinePk) || machinePk <= 0) {
    return (
      <div className="p-6 text-sm text-[#8b93a7]">
        Invalid machine.{" "}
        <Link to="/machines" className="text-[#3b6cff] hover:underline">
          Back to machines
        </Link>
      </div>
    )
  }

  const statusValue = entry ? machineStatus(entry) : null

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/machines" className="inline-flex items-center gap-1 text-sm text-[#3b6cff] hover:underline">
            <ArrowLeftIcon className="size-3.5" />
            Machines
          </Link>
          <h1 className="mt-2 text-[1.35rem] leading-none font-semibold tracking-tight wrap-break-word text-[#0f1f3d]">
            {entry?.machineId || (loading ? "Loading…" : "Machine")}
          </h1>
          {entry ? (
            <p className="mt-1.5 text-sm text-[#8b93a7]">
              Last seen {formatFullStamp(entry.lastSeenAt)} · online within {staleHours} hours
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-[#8b93a7]">{loading ? "Loading…" : "Not found"}</p>
          )}
        </div>
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      {entry ? (
        <TableScroll>
          <div className="min-w-0 space-y-4 pb-2">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card label="Status">
                {statusValue ? (
                  <StatusBadge tone={machineTone(statusValue)}>{machineStatusLabel(statusValue)}</StatusBadge>
                ) : null}
                <p className="mt-1 text-xs text-[#8b93a7]">{entry.seated ? "Occupying a seat" : "Seat released"}</p>
              </Card>
              <Card label="Product">
                <p className="font-medium wrap-break-word text-[#0f1f3d]">{entry.productName || "—"}</p>
                <p className="mt-0.5 text-xs text-[#8b93a7]">{entry.planType || "—"}</p>
              </Card>
              <Card label="IP">
                <CopyableText value={entry.ipAddress} label="ip" className="font-mono text-xs text-[#0f1f3d]" />
              </Card>
              <Card label="App version">
                <p className="wrap-break-word text-sm text-[#0f1f3d]">{entry.appVersion || "—"}</p>
              </Card>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Device</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Machine ID">
                    <CopyableText value={entry.machineId} label="machine id" className="font-mono text-xs text-[#0f1f3d]" />
                  </Row>
                  <Row label="OS">{entry.osVersion || "—"}</Row>
                  <Row label="Activated">{formatFullStamp(entry.activatedAt)}</Row>
                  <Row label="Last seen">{formatFullStamp(entry.lastSeenAt)}</Row>
                  <Row label="Released">{entry.deactivatedAt ? formatFullStamp(entry.deactivatedAt) : "—"}</Row>
                </dl>
              </section>

              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">License</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Key">
                    <CopyableText value={entry.key} label="license key" className="font-mono text-xs text-[#0f1f3d]" />
                  </Row>
                  <Row label="Customer">
                    {entry.customerId ? (
                      <Link to={`/customers/${entry.customerId}`} className="wrap-break-word text-[#3b6cff] hover:underline">
                        {entry.customerEmail || `customer#${entry.customerId}`}
                      </Link>
                    ) : (
                      <span className="wrap-break-word">{entry.customerEmail || "—"}</span>
                    )}
                  </Row>
                  <Row label="Seat">{entry.seated ? "Active" : "Released"}</Row>
                  <Row label="Check-ins">{heartbeats.length === 20 ? "20+" : String(heartbeats.length)}</Row>
                </dl>
              </section>
            </div>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <div className="flex items-start justify-between gap-3 border-b border-[#f0f3f8] px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#0f1f3d]">Recent check-ins</h2>
                  <p className="mt-0.5 text-xs text-[#8b93a7]">Heartbeats are kept for 14 days.</p>
                </div>
                <Link to="/heartbeats" className="shrink-0 text-xs text-[#3b6cff] hover:underline">
                  View all
                </Link>
              </div>
              <table className={listTableClass}>
                <thead className="bg-[#f8fafc] text-left text-[11px] tracking-wide text-[#8b93a7] uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">App</th>
                    <th className="px-4 py-3 font-medium">OS</th>
                    <th className="px-4 py-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {heartbeats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#8b93a7]">
                        No recent check-ins for this machine.
                      </td>
                    </tr>
                  ) : (
                    heartbeats.map((row) => (
                      <tr key={row.id} className="border-t border-[#f0f3f8]">
                        <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">{formatFullStamp(row.seenAt)}</td>
                        <td className="px-4 py-3 text-[#0f1f3d]">{row.appVersion || "—"}</td>
                        <td className="px-4 py-3 text-[#5b6478]">{row.osVersion || "—"}</td>
                        <td className="px-4 py-3">
                          <CopyableText value={row.ipAddress} label="ip" className="font-mono text-xs text-[#8b93a7]" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </div>
        </TableScroll>
      ) : null}
    </ListPageFrame>
  )
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
      <p className="text-xs text-[#8b93a7]">{label}</p>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <dt className="shrink-0 text-[#8b93a7]">{label}</dt>
      <dd className="min-w-0 wrap-break-word text-right text-[#0f1f3d]">{children}</dd>
    </div>
  )
}

function formatFullStamp(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}
