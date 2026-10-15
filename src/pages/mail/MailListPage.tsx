import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  EyeIcon,
  MailIcon,
  PauseCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
} from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CopyableText } from "@/components/CopyableText"
import { PaginationLimit, type PageSize } from "@/components/PaginationLimit"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, listTableClass, TableScroll } from "@/components/TableScroll"
import { Input } from "@/components/ui/input"
import {
  flushMail,
  listMail,
  mailLocaleLabel,
  mailStatusLabel,
  mailTemplateLabel,
  mailTone,
  resendMail,
  toMailActionError,
  type MailRow,
  type MailStatus,
} from "@/lib/api/mail"
import { formatCount } from "@/lib/format"
import { has, P } from "@/lib/permissions"
import { cn } from "@/lib/utils"

type SortKey = "email" | "template" | "subject" | "status" | "provider" | "attempts" | "createdAt"
type SortDir = "asc" | "desc"
type StatusFilter = "all" | MailStatus
type ConfirmAction = { kind: "resend"; row: MailRow } | { kind: "flush" }

export function MailListPage() {
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.mailWrite)
  const [rows, setRows] = useState<MailRow[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ total: 0, pending: 0, sent: 0, failed: 0 })
  const [templates, setTemplates] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [template, setTemplate] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageSize>(10)
  const [reload, setReload] = useState(0)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    listMail(
      token,
      {
        page,
        limit,
        q: debouncedQuery,
        status,
        template: template || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: sortKey,
        dir: sortDir,
      },
      ac.signal,
    )
      .then((body) => {
        setRows(body.mail)
        setTotal(body.total)
        setCounts(body.counts)
        setTemplates(body.templates ?? [])
        if (body.page !== page) setPage(body.page)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setError("Unable to load mail.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, reload, page, limit, debouncedQuery, status, template, fromDate, toDate, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "createdAt" || key === "attempts" ? "desc" : "asc")
  }

  async function applyResend(row: MailRow) {
    if (!token) return
    setActionPending(true)
    try {
      await resendMail(token, row.id)
      toast.success("Message queued to send again")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toMailActionError(err, "resend"))
    } finally {
      setActionPending(false)
    }
  }

  async function applyFlush() {
    if (!token) return
    setActionPending(true)
    try {
      const body = await flushMail(token)
      toast.success(body.sent === 0 ? "No messages were sent." : `Sent ${formatCount(body.sent)} ${body.sent === 1 ? "message" : "messages"}.`)
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toMailActionError(err, "flush"))
    } finally {
      setActionPending(false)
    }
  }

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">Mail Outbox</h1>
          <p className="mt-1.5 text-sm text-[#8b93a7]">
            License and refund messages are queued here, then sent by the mail provider. Resend puts a row back on the
            queue. Flush tries pending and failed mail now.
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => setConfirm({ kind: "flush" })}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
          >
            <SendIcon className="size-4" />
            Flush queue
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={MailIcon} iconClass="bg-[#e8f0ff] text-[#3b6cff]" label="Total Mail" value={formatCount(counts.total)} />
        <Kpi icon={PauseCircleIcon} iconClass="bg-[#fff4d9] text-[#d97706]" label="Pending" value={formatCount(counts.pending)} />
        <Kpi icon={CheckCircle2Icon} iconClass="bg-[#e7f8ee] text-[#22c55e]" label="Sent" value={formatCount(counts.sent)} />
        <Kpi icon={CircleAlertIcon} iconClass="bg-[#fef2f2] text-[#dc2626]" label="Failed" value={formatCount(counts.failed)} />
      </div>

      <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#f0f3f8] px-4 py-3">
          <div className="relative min-w-[12rem] flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9aa3b5]" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search email, subject, template…"
              className="h-10 rounded-xl border-[#e8edf5] bg-white pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter)
              setPage(1)
            }}
            aria-label="Mail status"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={template}
            onChange={(e) => {
              setTemplate(e.target.value)
              setPage(1)
            }}
            aria-label="Template"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="">All Templates</option>
            {templates.map((item) => (
              <option key={item} value={item}>
                {mailTemplateLabel(item)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              setFromDate(e.target.value)
              setPage(1)
            }}
            aria-label="Created from"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          />
          <span className="text-xs text-[#8b93a7]">to</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              setToDate(e.target.value)
              setPage(1)
            }}
            aria-label="Created to"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          />
          {fromDate || toDate ? (
            <button
              type="button"
              onClick={() => {
                setFromDate("")
                setToDate("")
                setPage(1)
              }}
              className="h-10 rounded-xl px-2 text-sm text-[#3b6cff] hover:bg-[#f4f6fb]"
            >
              Clear dates
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Refresh mail"
            onClick={() => setReload((n) => n + 1)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-[#e8edf5] text-[#5b6478] hover:bg-[#f4f6fb]"
          >
            <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
          </button>
        </div>

        <TableScroll>
          <table className={listTableClass}>
            <thead className="sticky top-0 z-10 bg-[#f8fafc] text-left text-[11px] tracking-wide text-[#8b93a7]">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <SortHeader label="To" column="email" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Template" column="template" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <th className="px-4 py-3 font-medium">Language</th>
                <SortHeader label="Subject" column="subject" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Provider" column="provider" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Attempts" column="attempts" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Created" column="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <th className="sticky right-0 z-20 bg-[#f8fafc] px-3 py-3 text-right font-medium shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#8b93a7]">
                    Loading mail…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#8b93a7]">
                    {debouncedQuery || status !== "all" || template || fromDate || toDate
                      ? "No mail matches these filters."
                      : "No outbound mail yet. Messages appear when a license is issued or an order is refunded."}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-[#f0f3f8] hover:bg-[#fafbfe]">
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">{from + index}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        {row.customerId ? (
                          <Link to={`/customers/${row.customerId}`} className="font-medium text-[#0f1f3d] hover:text-[#3b6cff]">
                            {row.toName || row.toEmail || "Customer"}
                          </Link>
                        ) : (
                          <span className="font-medium text-[#0f1f3d]">{row.toName || "—"}</span>
                        )}
                        <CopyableText value={row.toEmail} label="email" className="text-xs text-[#8b93a7]" />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{mailTemplateLabel(row.template)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{mailLocaleLabel(row.locale)}</td>
                    <td className="max-w-[18rem] px-4 py-3 text-[#0f1f3d]">
                      <span className="line-clamp-2 wrap-break-word">{row.subject || "—"}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge tone={mailTone(row.status)}>{mailStatusLabel(row.status)}</StatusBadge>
                      {row.status === "failed" && row.lastError ? (
                        <p className="mt-1 max-w-[12rem] truncate text-[11px] text-[#dc2626]" title={row.lastError}>
                          {row.lastError}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{row.provider || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{formatCount(row.attempts)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                      {formatCreatedAt(row.createdAt).map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </td>
                    <td className="sticky right-0 z-10 min-w-[8.5rem] bg-white px-3 py-3 shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/mail/${row.id}`}
                          aria-label={`View mail ${row.id}`}
                          title={`View mail ${row.id}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#5b6478] hover:bg-[#f4f6fb]"
                        >
                          <EyeIcon className="size-4" />
                        </Link>
                        {canWrite ? (
                          <IconAction label={`Resend to ${row.toEmail}`} onClick={() => setConfirm({ kind: "resend", row })}>
                            <SendIcon className="size-4" />
                          </IconAction>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScroll>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#f0f3f8] px-4 py-3 text-sm text-[#8b93a7]">
          <p>
            Showing {from} to {to} of {formatCount(total)} messages
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <PaginationLimit
              value={limit}
              disabled={loading}
              onChange={(next) => {
                setLimit(next)
                setPage(1)
              }}
            />
            <div className="flex items-center gap-1">
              <PagerButton disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
                ‹
              </PagerButton>
              {visiblePages(page, pages).map((item, index) =>
                item === "gap" ? (
                  <span key={`gap-${index}`} className="flex size-8 items-center justify-center text-[#c5cad6]">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg text-sm",
                      item === page ? "bg-[#3b6cff] text-white" : "text-[#5b6478] hover:bg-[#f4f6fb]",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}
              <PagerButton disabled={page >= pages} onClick={() => setPage((n) => n + 1)}>
                ›
              </PagerButton>
            </div>
          </div>
        </div>
      </div>

      {confirm?.kind === "resend" ? (
        <ConfirmDialog
          title="Resend message"
          description={`Queue “${confirm.row.subject || mailTemplateLabel(confirm.row.template)}” to ${confirm.row.toEmail} again?`}
          confirmLabel="Resend"
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(null)
          }}
          onConfirm={() => void applyResend(confirm.row)}
        />
      ) : null}

      {confirm?.kind === "flush" ? (
        <ConfirmDialog
          title="Flush mail queue"
          description="Send pending and failed messages now? Up to 100 will be attempted."
          confirmLabel="Flush queue"
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(null)
          }}
          onConfirm={() => void applyFlush()}
        />
      ) : null}
    </ListPageFrame>
  )
}

function SortHeader({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string
  column: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (column: SortKey) => void
}) {
  const active = sortKey === column
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn("inline-flex items-center gap-1 uppercase", active ? "text-[#0f1f3d]" : "hover:text-[#5b6478]")}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUpIcon className="size-3" />
          ) : (
            <ArrowDownIcon className="size-3" />
          )
        ) : (
          <span className="size-3" />
        )}
      </button>
    </th>
  )
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-lg text-[#5b6478] hover:bg-[#f4f6fb]"
    >
      {children}
    </button>
  )
}

function Kpi({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: typeof MailIcon
  iconClass: string
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
      <div className={cn("flex size-10 items-center justify-center rounded-xl", iconClass)}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs text-[#8b93a7]">{label}</p>
        <p className="text-[1.45rem] leading-none font-semibold text-[#0f1f3d]">{value}</p>
      </div>
    </div>
  )
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-lg text-[#5b6478] hover:bg-[#f4f6fb] disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function visiblePages(current: number, pages: number): Array<number | "gap"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const marks = new Set([1, pages, current - 1, current, current + 1])
  const nums = [...marks].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out: Array<number | "gap"> = []
  for (const n of nums) {
    const prev = out[out.length - 1]
    if (typeof prev === "number" && n - prev > 1) out.push("gap")
    out.push(n)
  }
  return out
}

function formatCreatedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return [iso]
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return [datePart, `${hh}:${mm}`]
}
