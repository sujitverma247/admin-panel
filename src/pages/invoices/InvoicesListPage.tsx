import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanIcon,
  CheckCircle2Icon,
  EyeIcon,
  FileDownIcon,
  FileTextIcon,
  RefreshCwIcon,
  SearchIcon,
  WalletIcon,
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
  downloadInvoicePdf,
  invoiceStatusLabel,
  invoiceTone,
  listInvoices,
  toInvoiceActionError,
  voidInvoice,
  type InvoiceRow,
  type InvoiceStatus,
} from "@/lib/api/invoices"
import { formatCount, formatMoney } from "@/lib/format"
import { has, P } from "@/lib/permissions"
import { cn } from "@/lib/utils"

type SortKey = "number" | "email" | "product" | "amount" | "gateway" | "status" | "issuedAt"
type SortDir = "asc" | "desc"
type StatusFilter = "all" | InvoiceStatus

export function InvoicesListPage() {
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.invoiceWrite)
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ total: 0, issued: 0, voided: 0 })
  const [gateways, setGateways] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [gateway, setGateway] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("issuedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageSize>(10)
  const [reload, setReload] = useState(0)
  const [pdfId, setPdfId] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<InvoiceRow | null>(null)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    listInvoices(
      token,
      {
        page,
        limit,
        q: debouncedQuery,
        status,
        gateway: gateway || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: sortKey,
        dir: sortDir,
      },
      ac.signal,
    )
      .then((body) => {
        setRows(body.invoices)
        setTotal(body.total)
        setCounts(body.counts)
        setGateways(body.gateways ?? [])
        if (body.page !== page) setPage(body.page)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setError("Unable to load invoices.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, reload, page, limit, debouncedQuery, status, gateway, fromDate, toDate, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "issuedAt" || key === "amount" ? "desc" : "asc")
  }

  async function downloadPdf(row: InvoiceRow) {
    if (!token || pdfId != null) return
    setPdfId(row.id)
    try {
      await downloadInvoicePdf(token, row.id, row.number)
      toast.success("Invoice PDF downloaded")
    } catch (err) {
      toast.error(toInvoiceActionError(err, "pdf"))
    } finally {
      setPdfId(null)
    }
  }

  async function applyVoid(row: InvoiceRow) {
    if (!token) return
    setActionPending(true)
    try {
      await voidInvoice(token, row.id)
      toast.success("Invoice cancelled")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toInvoiceActionError(err, "void"))
    } finally {
      setActionPending(false)
    }
  }

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">Invoices</h1>
          <p className="mt-1.5 text-sm text-[#8b93a7]">
            A paid order creates an invoice. Cancelled means the document is no longer a bill — it does not refund
            money. Refunds happen on the payment gateway.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi icon={WalletIcon} iconClass="bg-[#e8f0ff] text-[#3b6cff]" label="Total Invoices" value={formatCount(counts.total)} />
        <Kpi icon={CheckCircle2Icon} iconClass="bg-[#e7f8ee] text-[#22c55e]" label="Paid" value={formatCount(counts.issued)} />
        <Kpi icon={FileTextIcon} iconClass="bg-[#fef2f2] text-[#dc2626]" label="Cancelled" value={formatCount(counts.voided)} />
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
              placeholder="Search number, email, order…"
              className="h-10 rounded-xl border-[#e8edf5] bg-white pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter)
              setPage(1)
            }}
            aria-label="Invoice status"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="all">All Status</option>
            <option value="issued">Paid</option>
            <option value="void">Cancelled</option>
          </select>
          <select
            value={gateway}
            onChange={(e) => {
              setGateway(e.target.value)
              setPage(1)
            }}
            aria-label="Gateway"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="">All Gateways</option>
            {gateways.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
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
            aria-label="Issued from"
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
            aria-label="Issued to"
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
            aria-label="Refresh invoices"
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
                <SortHeader label="Number" column="number" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Customer" column="email" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Product" column="product" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Amount" column="amount" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Gateway" column="gateway" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Issued At" column="issuedAt" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <th className="sticky right-0 z-20 bg-[#f8fafc] px-3 py-3 text-right font-medium shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#8b93a7]">
                    Loading invoices…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#8b93a7]">
                    {debouncedQuery || status !== "all" || gateway || fromDate || toDate
                      ? "No invoices match these filters."
                      : "No invoices yet. They appear when an order is marked paid."}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-[#f0f3f8] hover:bg-[#fafbfe]">
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">{from + index}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CopyableText value={row.number} label="invoice number" className="font-mono text-[#0f1f3d]" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        {row.customerId ? (
                          <Link to={`/customers/${row.customerId}`} className="font-medium text-[#0f1f3d] hover:text-[#3b6cff]">
                            {row.customerName || row.customerEmail || "Customer"}
                          </Link>
                        ) : (
                          <span className="font-medium text-[#0f1f3d]">{row.customerName || "—"}</span>
                        )}
                        <CopyableText value={row.customerEmail} label="email" className="text-xs text-[#8b93a7]" />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#0f1f3d]">
                      <span className="block">{row.productName || "—"}</span>
                      <span className="text-xs text-[#8b93a7]">{row.planType}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[#0f1f3d]">
                      {formatMoney(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{formatLabel(row.gateway)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge tone={invoiceTone(row.status)}>{invoiceStatusLabel(row.status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                      {formatCreatedAt(row.issuedAt).map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </td>
                    <td className="sticky right-0 z-10 min-w-[8.5rem] bg-white px-3 py-3 shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/invoices/${row.id}`}
                          aria-label={`View invoice ${row.number}`}
                          title={`View invoice ${row.number}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#5b6478] hover:bg-[#f4f6fb]"
                        >
                          <EyeIcon className="size-4" />
                        </Link>
                        <IconAction
                          label={pdfId === row.id ? `Preparing PDF for ${row.number}` : `Download PDF ${row.number}`}
                          onClick={() => void downloadPdf(row)}
                        >
                          <FileDownIcon className={cn("size-4", pdfId === row.id && "animate-pulse")} />
                        </IconAction>
                        {canWrite && row.status === "issued" ? (
                          <IconAction label={`Cancel ${row.number}`} onClick={() => setConfirm(row)}>
                            <BanIcon className="size-4" />
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
            Showing {from} to {to} of {formatCount(total)} invoices
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

      {confirm ? (
        <ConfirmDialog
          title="Cancel invoice"
          description={`Cancel ${confirm.number}? Cancelled means this document is no longer a bill. It does not refund the payment — refunds happen on the gateway.`}
          confirmLabel="Cancel Invoice"
          danger
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(null)
          }}
          onConfirm={() => void applyVoid(confirm)}
        />
      ) : null}
    </ListPageFrame>
  )
}

function formatLabel(value: string) {
  if (!value) return "—"
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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
  icon: typeof WalletIcon
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
