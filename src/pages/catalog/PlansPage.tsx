import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  PauseCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { PaginationLimit, type PageSize } from "@/components/PaginationLimit"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, listTableClass, TableScroll } from "@/components/TableScroll"
import { Input } from "@/components/ui/input"
import {
  createPlan,
  deletePlan,
  listPlans,
  listProducts,
  toPlanDeleteError,
  toPlanError,
  updatePlan,
  type PlanRow,
  type ProductRow,
} from "@/lib/api/catalog"
import { formatCount } from "@/lib/format"
import { has, P } from "@/lib/permissions"
import { hasFieldErrors } from "@/lib/validation"
import {
  draftFromPlan,
  emptyPlanDraft,
  PLAN_GATEWAYS,
  validatePlanDraft,
  type PlanDraft,
  type PlanFieldErrors,
} from "@/lib/schemas/plan"
import { cn } from "@/lib/utils"
import { PlanDialog } from "@/pages/catalog/PlanDialog"

type SortKey = "product" | "name" | "code" | "gateway" | "external" | "duration" | "machines" | "status" | "createdAt"
type SortDir = "asc" | "desc"

export function PlansPage() {
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.planWrite)
  const [rows, setRows] = useState<PlanRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [gateways, setGateways] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [productId, setProductId] = useState("")
  const [gateway, setGateway] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageSize>(10)
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [draft, setDraft] = useState<PlanDraft>(emptyPlanDraft())
  const [fieldErrors, setFieldErrors] = useState<PlanFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<
    | { kind: "update" }
    | { kind: "inactive"; row: PlanRow }
    | { kind: "delete"; row: PlanRow }
    | null
  >(null)
  const [actionPending, setActionPending] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    listProducts(token, { limit: 100, sort: "name", dir: "asc" }, ac.signal)
      .then((body) => setProducts(body.products))
      .catch(() => {
        if (!ac.signal.aborted) setProducts([])
      })
    return () => ac.abort()
  }, [token, reload])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    listPlans(
      token,
      {
        page,
        limit,
        q: debouncedQuery,
        status,
        productId: productId ? Number(productId) : undefined,
        gateway: gateway || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: sortKey,
        dir: sortDir,
      },
      ac.signal,
    )
      .then((body) => {
        setRows(body.plans)
        setTotal(body.total)
        setCounts(body.counts)
        setGateways(body.gateways ?? [])
        if (body.page !== page) setPage(body.page)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setError("Unable to load plans.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, reload, page, limit, debouncedQuery, status, productId, gateway, fromDate, toDate, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const filtersActive = Boolean(query || status !== "all" || productId || gateway || fromDate || toDate)
  const gatewayOptions = [...new Set([...PLAN_GATEWAYS, ...gateways])]

  function toggleSort(key: SortKey) {
    setPage(1)
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "createdAt" ? "desc" : "asc")
  }

  function openCreate() {
    setEditing(null)
    setDraft(emptyPlanDraft())
    setFieldErrors({})
    setFormError(null)
    setDialog("create")
  }

  function openEdit(row: PlanRow) {
    setEditing(row)
    setDraft(draftFromPlan(row))
    setFieldErrors({})
    setFormError(null)
    setDialog("edit")
  }

  function changeDraft(next: PlanDraft, field?: keyof PlanDraft) {
    setDraft(next)
    setFieldErrors((current) => {
      if (!field) return current
      const nextErrors = validatePlanDraft(next, dialog === "edit" ? "edit" : "create")
      const updated = { ...current }
      if (nextErrors[field]) updated[field] = nextErrors[field]
      else delete updated[field]
      if (field === "displayName" && next.code !== draft.code) {
        if (nextErrors.code) updated.code = nextErrors.code
        else delete updated.code
      }
      return updated
    })
    if (formError) setFormError(null)
  }

  function requestSave() {
    const errors = validatePlanDraft(draft, dialog === "edit" ? "edit" : "create")
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
      const payload = {
        displayName: draft.displayName.trim(),
        durationDays: Number(draft.durationDays),
        defaultMaxMachines: Number(draft.defaultMaxMachines),
        productId: Number(draft.productId),
        gateway: draft.gateway.trim().toLowerCase(),
        externalPlanId: draft.externalPlanId.trim(),
      }
      if (dialog === "create") {
        await createPlan(token, {
          ...payload,
          code: draft.code.trim(),
        })
        toast.success("Plan added")
      } else if (editing) {
        await updatePlan(token, editing.id, {
          ...payload,
          isActive: draft.isActive,
        })
        toast.success("Plan updated")
      }
      setConfirm(null)
      setDialog(null)
      setReload((n) => n + 1)
    } catch (err) {
      setConfirm(null)
      setFormError(toPlanError(err))
    } finally {
      setSaving(false)
    }
  }

  function requestStatusChange(row: PlanRow) {
    if (row.isActive) {
      setConfirm({ kind: "inactive", row })
      return
    }
    void applyStatus(row, true)
  }

  async function applyStatus(row: PlanRow, isActive: boolean) {
    if (!token) return
    setActionPending(true)
    try {
      await updatePlan(token, row.id, { displayName: row.displayName, isActive })
      toast.success(isActive ? "Plan activated" : "Plan set inactive")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toPlanError(err))
    } finally {
      setActionPending(false)
    }
  }

  async function applyDelete(row: PlanRow) {
    if (!token) return
    setActionPending(true)
    try {
      await deletePlan(token, row.id)
      toast.success("Plan deleted")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toPlanDeleteError(err))
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
          <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">Plans</h1>
          <p className="mt-1.5 text-sm text-[#8b93a7]">Map products to payment-gateway plan IDs. Price is set on the gateway.</p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
          >
            <PlusIcon className="size-4" />
            Add Plan
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi icon={CreditCardIcon} iconClass="bg-[#e8f0ff] text-[#3b6cff]" label="Total Plans" value={formatCount(counts.total)} />
        <Kpi icon={CheckCircle2Icon} iconClass="bg-[#e7f8ee] text-[#22c55e]" label="Active Plans" value={formatCount(counts.active)} />
        <Kpi
          icon={PauseCircleIcon}
          iconClass="bg-[#eef1f6] text-[#64748b]"
          label="Inactive Plans"
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
              placeholder="Search plans…"
              className="h-10 rounded-xl border-[#e8edf5] bg-white pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status)
              setPage(1)
            }}
            aria-label="Plan status"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value)
              setPage(1)
            }}
            aria-label="Product"
            className="h-10 max-w-[14rem] rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.displayName}
              </option>
            ))}
          </select>
          <select
            value={gateway}
            onChange={(e) => {
              setGateway(e.target.value)
              setPage(1)
            }}
            aria-label="Payment gateway"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="">All Gateways</option>
            {gatewayOptions.map((name) => (
              <option key={name} value={name}>
                {name}
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
            {formatCount(total)} {total === 1 ? "plan" : "plans"}
          </p>
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e8edf5] text-[#8b93a7] hover:bg-[#f8fafc]"
            aria-label="Refresh plans"
          >
            <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
          </button>
        </div>

        <TableScroll>
          <table className={listTableClass}>
            <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <SortHeader label="Product" column="product" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Name" column="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Code" column="code" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Gateway" column="gateway" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Gateway ID" column="external" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Duration" column="duration" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Machines" column="machines" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
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
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-[#8b93a7]">
                    {loading
                      ? "Loading plans…"
                      : filtersActive
                        ? "No plans match this search."
                        : "No plans yet"}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-[#f0f3f8]">
                    <td className="px-4 py-3 text-[#8b93a7]">{from + index}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#0f1f3d]">{row.productName || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[#0f1f3d]">{row.displayName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{row.planCode || row.code}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{row.gateway}</td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap text-[#0f1f3d]">{row.externalPlanId}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{formatDuration(row.durationDays)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{row.defaultMaxMachines}</td>
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
                      {canWrite ? (
                        <div className="flex items-center justify-end gap-1">
                          <IconAction label={`Edit ${row.displayName}`} onClick={() => openEdit(row)}>
                            <PencilIcon className="size-4" />
                          </IconAction>
                          <IconAction
                            label={row.isActive ? `Set ${row.displayName} inactive` : `Activate ${row.displayName}`}
                            onClick={() => requestStatusChange(row)}
                          >
                            {row.isActive ? <PauseCircleIcon className="size-4" /> : <CheckCircle2Icon className="size-4" />}
                          </IconAction>
                          <IconAction label={`Delete ${row.displayName}`} danger onClick={() => setConfirm({ kind: "delete", row })}>
                            <Trash2Icon className="size-4" />
                          </IconAction>
                        </div>
                      ) : (
                        <span className="block text-right text-[#c5cad6]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScroll>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#f0f3f8] px-4 py-3 text-sm text-[#8b93a7]">
          <p>
            Showing {from} to {to} of {formatCount(total)} plans
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
        <PlanDialog
          mode={dialog}
          draft={draft}
          products={products}
          gateways={gateways}
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
          title="Update plan"
          description={
            editing
              ? `Save changes to “${draft.displayName.trim() || editing.displayName}”?${
                  editing.isActive && !draft.isActive ? " This will also set the plan inactive." : ""
                }`
              : "Save these plan changes?"
          }
          confirmLabel="Update Plan"
          pending={saving}
          onClose={closeConfirm}
          onConfirm={() => void save()}
        />
      ) : null}

      {confirm?.kind === "inactive" ? (
        <ConfirmDialog
          title="Set plan inactive"
          description={`Set “${confirm.row.displayName}” inactive? It will stay in the list but will be marked inactive.`}
          confirmLabel="Set Inactive"
          pending={actionPending}
          onClose={closeConfirm}
          onConfirm={() => void applyStatus(confirm.row, false)}
        />
      ) : null}

      {confirm?.kind === "delete" ? (
        <ConfirmDialog
          title="Delete plan"
          description={
            (confirm.row.licenseCount ?? 0) > 0
              ? `“${confirm.row.displayName}” has ${confirm.row.licenseCount} license(s) and cannot be deleted. Set it inactive instead.`
              : `Delete “${confirm.row.displayName}”? This cannot be undone.`
          }
          confirmLabel={(confirm.row.licenseCount ?? 0) > 0 ? "Close" : "Delete Plan"}
          danger={(confirm.row.licenseCount ?? 0) === 0}
          pending={actionPending}
          onClose={closeConfirm}
          onConfirm={() => {
            if ((confirm.row.licenseCount ?? 0) > 0) {
              closeConfirm()
              return
            }
            void applyDelete(confirm.row)
          }}
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
  danger,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg",
        danger ? "text-[#dc2626] hover:bg-[#fef2f2]" : "text-[#5b6478] hover:bg-[#f4f6fb]",
      )}
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
  icon: typeof CreditCardIcon
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

function formatDuration(days: number) {
  if (days >= 36500) return "Lifetime"
  if (days === 1825) return "5 years"
  if (days === 1095) return "3 years"
  if (days === 730) return "2 years"
  if (days === 365) return "1 year"
  if (days === 30) return "Monthly"
  return `${days} days`
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
