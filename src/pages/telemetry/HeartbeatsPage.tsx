import { useEffect, useState } from "react"
import { Link } from "react-router"
import {
  ActivityIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarClockIcon,
  EyeIcon,
  MonitorIcon,
  RefreshCwIcon,
  SearchIcon,
  TimerIcon,
} from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { CopyableText } from "@/components/CopyableText"
import { PaginationLimit, type PageSize } from "@/components/PaginationLimit"
import { ListPageFrame, listTableClass, TableScroll } from "@/components/TableScroll"
import { Input } from "@/components/ui/input"
import { listHeartbeats, type HeartbeatRow } from "@/lib/api/heartbeats"
import { formatCount } from "@/lib/format"
import { cn } from "@/lib/utils"

type SortKey = "seen" | "machine" | "product" | "app" | "ip"
type SortDir = "asc" | "desc"

export function HeartbeatsPage() {
  const { token } = useAuth()
  const [rows, setRows] = useState<HeartbeatRow[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ total: 0, last24h: 0, lastHour: 0, uniqueMachines: 0 })
  const [products, setProducts] = useState<{ id: number; name: string }[]>([])
  const [retentionDays, setRetentionDays] = useState(14)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [productId, setProductId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("seen")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageSize>(10)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    listHeartbeats(
      token,
      {
        page,
        limit,
        q: debouncedQuery,
        productId: productId ? Number(productId) : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: sortKey,
        dir: sortDir,
      },
      ac.signal,
    )
      .then((body) => {
        setRows(body.heartbeats)
        setTotal(body.total)
        setCounts(body.counts)
        setProducts(body.products ?? [])
        if (body.retentionDays > 0) setRetentionDays(body.retentionDays)
        if (body.page !== page) setPage(body.page)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setError("Unable to load heartbeats.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, reload, page, limit, debouncedQuery, productId, fromDate, toDate, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const filtersActive = Boolean(query || productId || fromDate || toDate)

  function onSort(key: SortKey) {
    setPage(1)
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "seen" ? "desc" : "asc")
  }

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">Heartbeats</h1>
          <p className="mt-1.5 text-sm text-[#8b93a7]">
            Check-ins from seated machines. Rows older than {retentionDays} days are removed.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={ActivityIcon} iconClass="bg-[#e8f0ff] text-[#3b6cff]" label="Total Check-ins" value={formatCount(counts.total)} />
        <Kpi icon={CalendarClockIcon} iconClass="bg-[#e7f8ee] text-[#22c55e]" label="Last 24 hours" value={formatCount(counts.last24h)} />
        <Kpi icon={TimerIcon} iconClass="bg-[#fff4d9] text-[#d97706]" label="Last hour" value={formatCount(counts.lastHour)} />
        <Kpi icon={MonitorIcon} iconClass="bg-[#eef1f6] text-[#64748b]" label="Unique machines" value={formatCount(counts.uniqueMachines)} />
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
              placeholder="Search machine, key, product, IP…"
              className="h-10 rounded-xl border-[#e8edf5] bg-white pl-9"
            />
          </div>
          <select
            value={productId}
            aria-label="Product"
            onChange={(e) => {
              setProductId(e.target.value)
              setPage(1)
            }}
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#0f1f3d]"
          >
            <option value="">All Products</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
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
            aria-label="Seen from"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          />
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              setToDate(e.target.value)
              setPage(1)
            }}
            aria-label="Seen to"
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
            aria-label="Refresh heartbeats"
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
                <SortHeader label="When" column="seen" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Machine" column="machine" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Product" column="product" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="App" column="app" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="IP" column="ip" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <th className="sticky right-0 z-20 bg-[#f8fafc] px-3 py-3 text-right font-medium shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#8b93a7]">
                    Loading heartbeats…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#8b93a7]">
                    {filtersActive
                      ? "No check-ins match these filters."
                      : "No heartbeats yet. Check-ins appear here after a seated machine reports in."}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-[#f0f3f8] hover:bg-[#fafbfe]">
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">{from + index}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                      {formatStamp(row.seenAt).map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <CopyableText value={row.machineId} label="machine id" className="font-mono text-xs text-[#0f1f3d]" />
                      <p className="mt-0.5 max-w-[12rem] truncate text-[11px] text-[#8b93a7]" title={row.osVersion || undefined}>
                        {row.osVersion || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0f1f3d]">{row.productName || "—"}</p>
                      {row.key ? (
                        <p className="mt-0.5 max-w-[11rem] truncate font-mono text-[11px] text-[#8b93a7]" title={row.key}>
                          {row.key}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#0f1f3d]">{row.appVersion || "—"}</td>
                    <td className="px-4 py-3">
                      <CopyableText value={row.ipAddress} label="ip" className="font-mono text-xs text-[#8b93a7]" />
                    </td>
                    <td className="sticky right-0 z-10 min-w-[4.5rem] bg-white px-3 py-3 shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                      <div className="flex items-center justify-end">
                        <Link
                          to={`/machines/${row.activationId}`}
                          aria-label={`View machine ${row.machineId}`}
                          title={`View machine ${row.machineId}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#5b6478] hover:bg-[#f4f6fb]"
                        >
                          <EyeIcon className="size-4" />
                        </Link>
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
            Showing {from} to {to} of {formatCount(total)} check-ins
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

function Kpi({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: typeof ActivityIcon
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

function formatStamp(iso: string) {
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
