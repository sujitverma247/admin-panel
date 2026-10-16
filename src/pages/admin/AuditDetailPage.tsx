import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeftIcon } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { CopyableText } from "@/components/CopyableText"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, TableScroll } from "@/components/TableScroll"
import {
  auditActionLabel,
  auditTone,
  auditUsername,
  getAudit,
  parseAuditTarget,
  type AuditRow,
} from "@/lib/api/audit"

export function AuditDetailPage() {
  const { id } = useParams()
  const auditId = Number(id)
  const { token } = useAuth()
  const [entry, setEntry] = useState<AuditRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !Number.isInteger(auditId) || auditId <= 0) return
    const ac = new AbortController()
    setLoading(true)
    getAudit(token, auditId, ac.signal)
      .then((body) => {
        setEntry(body.audit)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setEntry(null)
        setError("Unable to load this audit entry.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, auditId])

  if (!Number.isInteger(auditId) || auditId <= 0) {
    return (
      <div className="p-6 text-sm text-[#8b93a7]">
        Invalid audit entry.{" "}
        <Link to="/audit" className="text-[#3b6cff] hover:underline">
          Back to audit log
        </Link>
      </div>
    )
  }

  const linked = entry ? parseAuditTarget(entry.target) : null

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/audit" className="inline-flex items-center gap-1 text-sm text-[#3b6cff] hover:underline">
            <ArrowLeftIcon className="size-3.5" />
            Audit Log
          </Link>
          <h1 className="mt-2 text-[1.35rem] leading-none font-semibold tracking-tight wrap-break-word text-[#0f1f3d]">
            {entry ? auditActionLabel(entry.action) : loading ? "Loading…" : "Audit entry"}
          </h1>
          {entry ? (
            <p className="mt-1.5 text-sm text-[#8b93a7]">{formatFullStamp(entry.createdAt)}</p>
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
              <Card label="Action">
                <StatusBadge tone={auditTone(entry.action)}>{auditActionLabel(entry.action)}</StatusBadge>
                <p className="mt-1 font-mono text-xs text-[#8b93a7]">{entry.action}</p>
              </Card>
              <Card label="User">
                <p className="font-medium wrap-break-word text-[#0f1f3d]">{auditUsername(entry) || "System"}</p>
                {entry.role ? <p className="mt-0.5 text-xs text-[#8b93a7]">{titleRole(entry.role)}</p> : null}
              </Card>
              <Card label="IP">
                <CopyableText value={entry.ipAddress} label="ip" className="font-mono text-xs text-[#0f1f3d]" />
              </Card>
              <Card label="Entry ID">
                <p className="font-mono text-sm text-[#0f1f3d]">{entry.id}</p>
              </Card>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Target</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <Row label="Record">
                    {linked ? (
                      <Link to={linked.to} className="wrap-break-word font-mono text-xs text-[#3b6cff] hover:underline">
                        {linked.label}
                      </Link>
                    ) : (
                      <CopyableText value={entry.target} label="target" className="font-mono text-xs text-[#0f1f3d]" />
                    )}
                  </Row>
                  <Row label="When">{formatFullStamp(entry.createdAt)}</Row>
                  <Row label="User ID">{entry.userId ?? "—"}</Row>
                </dl>
              </section>

              <section className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
                <h2 className="text-sm font-semibold text-[#0f1f3d]">Details</h2>
                <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-[#0f1f3d]">
                  {entry.details || "—"}
                </p>
              </section>
            </div>
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

function titleRole(role: string) {
  if (!role) return role
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
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
