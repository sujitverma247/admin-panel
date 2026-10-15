import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  EyeIcon,
  PauseCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  UsersIcon,
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
  createCustomer,
  listCustomers,
  toCustomerError,
  updateCustomer,
  type CustomerRow,
} from "@/lib/api/customers"
import { formatCount } from "@/lib/format"
import { has, P } from "@/lib/permissions"
import { hasFieldErrors } from "@/lib/validation"
import {
  draftFromCustomer,
  emptyCustomerDraft,
  validateCustomerDraft,
  type CustomerDraft,
  type CustomerFieldErrors,
} from "@/lib/schemas/customer"
import { cn } from "@/lib/utils"
import { CustomerDialog } from "@/pages/customers/CustomerDialog"

type SortKey = "email" | "name" | "phone" | "source" | "keys" | "status" | "createdAt"
type SortDir = "asc" | "desc"

export function CustomersListPage() {
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.customerWrite)
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 })
  const [sources, setSources] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [source, setSource] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageSize>(10)
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<CustomerRow | null>(null)
  const [draft, setDraft] = useState<CustomerDraft>(emptyCustomerDraft())
  const [fieldErrors, setFieldErrors] = useState<CustomerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<{ kind: "update" } | { kind: "inactive"; row: CustomerRow } | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    listCustomers(
      token,
      {
        page,
        limit,
        q: debouncedQuery,
        status,
        source: source || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: sortKey,
        dir: sortDir,
      },
      ac.signal,
    )
      .then((body) => {
        setRows(body.customers)
        setTotal(body.total)
        setCounts(body.counts)
        setSources(body.sources ?? [])
        if (body.page !== page) setPage(body.page)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setError("Unable to load customers.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, reload, page, limit, debouncedQuery, status, source, fromDate, toDate, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const filtersActive = Boolean(query || status !== "all" || source || fromDate || toDate)

  function toggleSort(key: SortKey) {
    setPage(1)
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "createdAt" || key === "keys" ? "desc" : "asc")
  }

  function openCreate() {
    setEditing(null)
    setDraft(emptyCustomerDraft())
    setFieldErrors({})
    setFormError(null)
    setDialog("create")
  }

  function openEdit(row: CustomerRow) {
    setEditing(row)
    setDraft(draftFromCustomer(row))
    setFieldErrors({})
    setFormError(null)
    setDialog("edit")
  }

  function changeDraft(next: CustomerDraft, field?: keyof CustomerDraft) {
    setDraft(next)
    setFieldErrors((current) => {
      if (!field) return current
      const nextErrors = validateCustomerDraft(next)
      const updated = { ...current }
      if (nextErrors[field]) updated[field] = nextErrors[field]
      else delete updated[field]
      return updated
    })
    if (formError) setFormError(null)
  }

  function requestSave() {
    const errors = validateCustomerDraft(draft)
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) {
      setFormError("Please fix the highlighted fields.")
      return
    }
    if (dialog === "edit") {
      setConfirm({ kind: "update" })
      return
    }
    void save()
  }

  async function save() {
    if (!token) return
    setSaving(true)
    setFormError(null)
    try {
      if (dialog === "create") {
        await createCustomer(token, {
          email: draft.email.trim(),
          displayName: draft.displayName.trim(),
          phone: draft.phone.trim(),
          notes: draft.notes.trim(),
        })
        toast.success("Customer added")
      } else if (editing) {
        await updateCustomer(token, editing.id, {
          email: draft.email.trim(),
          displayName: draft.displayName.trim(),
          phone: draft.phone.trim(),
          notes: draft.notes.trim(),
          isActive: draft.isActive,
        })
        toast.success("Customer updated")
      }
      setConfirm(null)
      setDialog(null)
      setReload((n) => n + 1)
    } catch (err) {
      setConfirm(null)
      setFormError(toCustomerError(err))
    } finally {
      setSaving(false)
    }
  }

  function requestStatusChange(row: CustomerRow) {
    if (row.isActive) {
      setConfirm({ kind: "inactive", row })
      return
    }
    void applyStatus(row, true)
  }

  async function applyStatus(row: CustomerRow, isActive: boolean) {
    if (!token) return
    setActionPending(true)
    try {
      await updateCustomer(token, row.id, { email: row.email, isActive })
      toast.success(isActive ? "Customer activated" : "Customer set inactive")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toCustomerError(err))
    } finally {
      setActionPending(false)
    }
  }

  function closeConfirm() {
    if (!saving && !actionPending) setConfirm(null)
  }

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">Customers</h1>
          <p className="mt-1.5 text-sm text-[#8b93a7]">Buyers linked to keys, orders, and refund-policy acceptance</p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
          >
            <PlusIcon className="size-4" />
            Add Customer
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi icon={UsersIcon} iconClass="bg-[#e8f0ff] text-[#3b6cff]" label="Total Customers" value={formatCount(counts.total)} />
        <Kpi icon={CheckCircle2Icon} iconClass="bg-[#e7f8ee] text-[#22c55e]" label="Active Customers" value={formatCount(counts.active)} />
        <Kpi
          icon={PauseCircleIcon}
          iconClass="bg-[#eef1f6] text-[#64748b]"
          label="Inactive Customers"
          value={formatCount(counts.inactive)}
        />
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
              placeholder="Search email, name, phone…"
              className="h-10 rounded-xl border-[#e8edf5] bg-white pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status)
              setPage(1)
            }}
            aria-label="Customer status"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value)
              setPage(1)
            }}
            aria-label="Customer source"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="">All Sources</option>
            {sources.map((item) => (
              <option key={item} value={item}>
                {formatSource(item)}
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
          <p className="ml-auto text-sm text-[#8b93a7]">
            {formatCount(total)} {total === 1 ? "customer" : "customers"}
          </p>
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e8edf5] text-[#8b93a7] hover:bg-[#f8fafc]"
            aria-label="Refresh customers"
          >
            <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
          </button>
        </div>

        <TableScroll>
          <table className={listTableClass}>
            <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <SortHeader label="Email" column="email" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Name" column="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Phone" column="phone" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Source" column="source" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Keys" column="keys" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 font-medium">Policy</th>
                <SortHeader label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Created At" column="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="sticky right-0 z-20 min-w-[8.5rem] bg-white px-3 py-3 text-right font-medium shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-[#8b93a7]">
                    {loading
                      ? "Loading customers…"
                      : filtersActive
                        ? "No customers match this search."
                        : "No customers yet"}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-[#f0f3f8]">
                    <td className="px-4 py-3 text-[#8b93a7]">{from + index}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[#0f1f3d]">
                      <CopyableText value={row.email} label="email" className="font-medium text-[#0f1f3d]" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link to={`/customers/${row.id}`} className="font-medium text-[#3b6cff] hover:underline">
                        {row.displayName || "Untitled"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#0f1f3d]">
                      <CopyableText value={row.phone} label="phone" className="text-[#0f1f3d]" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{formatSource(row.source)}</td>
                    <td className="px-4 py-3 text-[#0f1f3d]">{row.licenseCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={row.acceptedCurrent ? "success" : "muted"}>
                        {row.acceptedCurrent ? "Accepted" : "Pending"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={row.isActive ? "success" : "danger"}>
                        {row.isActive ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>
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
                          to={`/customers/${row.id}`}
                          aria-label={`View ${row.email}`}
                          title={`View ${row.email}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#5b6478] hover:bg-[#f4f6fb]"
                        >
                          <EyeIcon className="size-4" />
                        </Link>
                        {canWrite ? (
                          <>
                            <IconAction label={`Edit ${row.email}`} onClick={() => openEdit(row)}>
                              <PencilIcon className="size-4" />
                            </IconAction>
                            <IconAction
                              label={row.isActive ? `Set ${row.email} inactive` : `Activate ${row.email}`}
                              onClick={() => requestStatusChange(row)}
                            >
                              {row.isActive ? <PauseCircleIcon className="size-4" /> : <CheckCircle2Icon className="size-4" />}
                            </IconAction>
                          </>
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
            Showing {from} to {to} of {formatCount(total)} customers
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

      {dialog ? (
        <CustomerDialog
          mode={dialog}
          draft={draft}
          fieldErrors={fieldErrors}
          error={formError}
          saving={saving}
          onChange={changeDraft}
          onClose={() => setDialog(null)}
          onSubmit={requestSave}
        />
      ) : null}

      {confirm?.kind === "update" ? (
        <ConfirmDialog
          title="Update customer"
          description={
            editing
              ? `Save changes to “${draft.email.trim() || editing.email}”?${
                  editing.isActive && !draft.isActive ? " This will also set the customer inactive." : ""
                }`
              : "Save these customer changes?"
          }
          confirmLabel="Update Customer"
          pending={saving}
          onClose={closeConfirm}
          onConfirm={() => void save()}
        />
      ) : null}

      {confirm?.kind === "inactive" ? (
        <ConfirmDialog
          title="Set customer inactive"
          description={`Set “${confirm.row.email}” inactive? The record stays in the list. Linked keys are not revoked.`}
          confirmLabel="Set Inactive"
          pending={actionPending}
          onClose={closeConfirm}
          onConfirm={() => void applyStatus(confirm.row, false)}
        />
      ) : null}
    </ListPageFrame>
  )
}

function formatSource(value: string) {
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
        className={cn(
          "inline-flex items-center gap-1 uppercase",
          active ? "text-[#0f1f3d]" : "hover:text-[#5b6478]",
        )}
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
  icon: typeof UsersIcon
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
