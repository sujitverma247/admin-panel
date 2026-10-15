import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  FileDownIcon,
  KeyRoundIcon,
  PauseCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CopyableText, writeClipboard } from "@/components/CopyableText"
import { PaginationLimit, type PageSize } from "@/components/PaginationLimit"
import { StatusBadge } from "@/components/StatusBadge"
import { listTableClass, TableScroll } from "@/components/TableScroll"
import { Input } from "@/components/ui/input"
import { listCatalogPlans, listProducts, type CatalogPlanRow, type ProductRow } from "@/lib/api/catalog"
import {
  downloadKeyEvidence,
  issueKey,
  listKeys,
  revokeKey,
  toEvidenceError,
  toIssueKeyError,
  toRevokeKeyError,
  toUpdateKeyError,
  updateKey,
  type IssuedKey,
  type KeyRow,
  type KeyStatus,
} from "@/lib/api/keys"
import { formatCount } from "@/lib/format"
import { has, P } from "@/lib/permissions"
import { hasFieldErrors } from "@/lib/validation"
import {
  draftFromKey,
  emptyIssueKeyDraft,
  validateEditKeyDraft,
  validateIssueKeyDraft,
  type EditKeyDraft,
  type EditKeyFieldErrors,
  type IssueKeyDraft,
  type IssueKeyFieldErrors,
} from "@/lib/schemas/key"
import { cn } from "@/lib/utils"
import { EditKeyDialog } from "@/pages/keys/EditKeyDialog"
import { IssueKeyDialog } from "@/pages/keys/IssueKeyDialog"

type SortKey = "key" | "product" | "plan" | "customer" | "source" | "status" | "purchased" | "activated" | "expires"
type SortDir = "asc" | "desc"
type StatusFilter = "all" | KeyStatus

export function KeysListPage() {
  const { token, user } = useAuth()
  const canIssue = has(user?.permissions, P.keyIssue)
  const canRevoke = has(user?.permissions, P.keyRevoke)
  const [rows, setRows] = useState<KeyRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [plans, setPlans] = useState<CatalogPlanRow[]>([])
  const [planTypes, setPlanTypes] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ total: 0, unused: 0, active: 0, revoked: 0 })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [productId, setProductId] = useState("")
  const [planType, setPlanType] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("purchased")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageSize>(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<IssueKeyDraft>(emptyIssueKeyDraft())
  const [fieldErrors, setFieldErrors] = useState<IssueKeyFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [issued, setIssued] = useState<IssuedKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [editing, setEditing] = useState<KeyRow | null>(null)
  const [editDraft, setEditDraft] = useState<EditKeyDraft | null>(null)
  const [editFieldErrors, setEditFieldErrors] = useState<EditKeyFieldErrors>({})
  const [editError, setEditError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<KeyRow | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const [evidenceId, setEvidenceId] = useState<number | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    listProducts(token, { limit: 100, status: "active", sort: "name", dir: "asc" }, ac.signal)
      .then((body) => setProducts(body.products))
      .catch(() => {
        if (!ac.signal.aborted) setProducts([])
      })
    listCatalogPlans(token, ac.signal)
      .then((body) => setPlans(body.plans ?? []))
      .catch(() => {
        if (!ac.signal.aborted) setPlans([])
      })
    return () => ac.abort()
  }, [token, reload])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    listKeys(
      token,
      {
        page,
        limit,
        q: debouncedQuery,
        status,
        productId: productId ? Number(productId) : undefined,
        planType: planType || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: sortKey,
        dir: sortDir,
      },
      ac.signal,
    )
      .then((body) => {
        setRows(body.keys)
        setTotal(body.total)
        setCounts(body.counts ?? { total: 0, unused: 0, active: 0, revoked: 0 })
        setPlanTypes(body.planTypes ?? [])
        setError(null)
      })
      .catch((err) => {
        if (ac.signal.aborted) return
        setError(err instanceof Error ? err.message : "Unable to load keys.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, reload, page, limit, debouncedQuery, status, productId, planType, fromDate, toDate, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const filtersActive = Boolean(query || status !== "all" || productId || planType || fromDate || toDate)

  function toggleSort(column: SortKey) {
    if (sortKey === column) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(column)
      setSortDir(column === "purchased" || column === "activated" || column === "expires" ? "desc" : "asc")
    }
    setPage(1)
  }

  function openCreate() {
    const firstPlan = plans[0]
    setDraft({
      ...emptyIssueKeyDraft(),
      planType: firstPlan?.code ?? "1year",
      maxMachines: String(firstPlan?.defaultMaxMachines ?? 3),
    })
    setFieldErrors({})
    setFormError(null)
    setIssued(null)
    setCopied(false)
    setDialogOpen(true)
  }

  function changeDraft(next: IssueKeyDraft, field?: keyof IssueKeyDraft) {
    setDraft(next)
    if (field) setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    setFormError(null)
  }

  async function submitIssue() {
    if (!token) return
    const errors = validateIssueKeyDraft(draft)
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) return
    setSaving(true)
    setFormError(null)
    try {
      const body = await issueKey(token, {
        productId: Number(draft.productId),
        customerEmail: draft.customerEmail.trim(),
        name: draft.name.trim() || undefined,
        planType: draft.planType,
        maxMachines: Number(draft.maxMachines),
        notes: draft.notes.trim() || undefined,
      })
      setIssued(body)
      setCopied(false)
      toast.success("License key issued")
      setReload((n) => n + 1)
    } catch (err) {
      setFormError(toIssueKeyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function copyText(value: string, rowId?: number) {
    try {
      await writeClipboard(value)
      setCopied(true)
      if (rowId != null) {
        setCopiedId(rowId)
        window.setTimeout(() => {
          setCopiedId((current) => (current === rowId ? null : current))
        }, 1600)
      } else {
        toast.success("Copied")
      }
    } catch {
      toast.error("Could not copy")
    }
  }

  function openEdit(row: KeyRow) {
    setEditing(row)
    setEditDraft(draftFromKey(row))
    setEditFieldErrors({})
    setEditError(null)
  }

  function changeEdit(next: EditKeyDraft, field?: keyof EditKeyDraft) {
    setEditDraft(next)
    if (field) setEditFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    setEditError(null)
  }

  async function submitEdit() {
    if (!token || !editing || !editDraft) return
    const errors = validateEditKeyDraft(editDraft)
    setEditFieldErrors(errors)
    if (hasFieldErrors(errors)) return
    setSaving(true)
    setEditError(null)
    try {
      await updateKey(token, {
        id: editing.id,
        customerEmail: editDraft.customerEmail.trim(),
        planType: editDraft.planType,
        maxMachines: Number(editDraft.maxMachines),
        notes: editDraft.notes.trim(),
      })
      toast.success("Key updated")
      setEditing(null)
      setEditDraft(null)
      setReload((n) => n + 1)
    } catch (err) {
      setEditError(toUpdateKeyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function downloadEvidence(row: KeyRow) {
    if (!token || evidenceId != null) return
    setEvidenceId(row.id)
    try {
      await downloadKeyEvidence(token, row.id)
      toast.success("Evidence PDF downloaded")
    } catch (err) {
      toast.error(toEvidenceError(err))
    } finally {
      setEvidenceId(null)
    }
  }

  async function applyRevoke(row: KeyRow) {
    if (!token) return
    setActionPending(true)
    try {
      await revokeKey(token, row.id)
      toast.success("Key revoked")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toRevokeKeyError(err))
    } finally {
      setActionPending(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">Keys</h1>
          <p className="mt-1.5 text-sm text-[#8b93a7]">Issue retail keys by hand. The plan term starts on purchase.</p>
        </div>
        {canIssue ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
          >
            <PlusIcon className="size-4" />
            Issue Key
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={KeyRoundIcon} iconClass="bg-[#e8f0ff] text-[#3b6cff]" label="Total Keys" value={formatCount(counts.total)} />
        <Kpi icon={PauseCircleIcon} iconClass="bg-[#eef1f6] text-[#64748b]" label="Unused" value={formatCount(counts.unused)} />
        <Kpi icon={CheckCircle2Icon} iconClass="bg-[#e7f8ee] text-[#22c55e]" label="Active" value={formatCount(counts.active)} />
        <Kpi icon={BanIcon} iconClass="bg-[#fef2f2] text-[#dc2626]" label="Revoked" value={formatCount(counts.revoked)} />
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
              placeholder="Search keys or email…"
              className="h-10 rounded-xl border-[#e8edf5] bg-white pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter)
              setPage(1)
            }}
            aria-label="Key status"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="all">All Status</option>
            <option value="unused">Unused</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
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
            value={planType}
            onChange={(e) => {
              setPlanType(e.target.value)
              setPage(1)
            }}
            aria-label="Plan"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="">All Plans</option>
            {planFilterOptions(planTypes, plans).map((code) => (
              <option key={code} value={code}>
                {plans.find((p) => p.code === code)?.displayName ?? code}
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
            {formatCount(total)} {total === 1 ? "key" : "keys"}
          </p>
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e8edf5] text-[#8b93a7] hover:bg-[#f8fafc]"
            aria-label="Refresh keys"
          >
            <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
          </button>
        </div>

        <TableScroll>
          <table className={listTableClass}>
            <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <SortHeader label="Key" column="key" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Product" column="product" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Plan" column="plan" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Purchased" column="purchased" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Activated" column="activated" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Expires" column="expires" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Customer" column="customer" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Source" column="source" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="sticky right-0 z-20 bg-white px-3 py-3 text-right font-medium shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-[#8b93a7]">
                    {loading ? "Loading keys…" : filtersActive ? "No keys match this search." : "No keys yet"}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-[#f0f3f8]">
                    <td className="px-4 py-3 text-[#8b93a7]">{from + index}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={copiedId === row.id ? "Copied" : `Copy ${row.key}`}
                          title={copiedId === row.id ? "Copied" : "Copy key"}
                          onClick={() => void copyText(row.key, row.id)}
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[#5b6478] hover:bg-[#f4f6fb]"
                        >
                          {copiedId === row.id ? <CheckIcon className="size-3.5 text-[#16a34a]" /> : <CopyIcon className="size-3.5" />}
                        </button>
                        <button
                          type="button"
                          title={copiedId === row.id ? "Copied" : "Copy key"}
                          onClick={() => void copyText(row.key, row.id)}
                          className="font-mono text-[#0f1f3d] hover:text-[#3b6cff]"
                        >
                          {row.key}
                        </button>
                        {copiedId === row.id ? (
                          <span className="rounded-full bg-[#e7f8ee] px-2 py-0.5 text-[10px] font-medium text-[#16a34a]">Copied</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#0f1f3d]">{row.productName || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{row.planType}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={statusTone(row.status)}>{titleCase(row.status)}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                      <DateCell value={row.purchasedAt || row.createdAt} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                      <DateCell value={row.activatedAt} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                      <DateCell value={row.expiresAt} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">
                      <CopyableText value={row.customerEmail} label="email" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{row.source || "manual"}</td>
                    <td className="sticky right-0 z-10 bg-white px-3 py-3 shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction
                          label={evidenceId === row.id ? `Preparing evidence for ${row.key}` : `Download evidence ${row.key}`}
                          onClick={() => void downloadEvidence(row)}
                        >
                          <FileDownIcon className={cn("size-4", evidenceId === row.id && "animate-pulse")} />
                        </IconAction>
                        {canRevoke ? (
                          <IconAction label={`Edit ${row.key}`} onClick={() => openEdit(row)}>
                            <PencilIcon className="size-4" />
                          </IconAction>
                        ) : null}
                        {canRevoke && row.status !== "revoked" ? (
                          <IconAction label={`Revoke ${row.key}`} danger onClick={() => setConfirm(row)}>
                            <BanIcon className="size-4" />
                          </IconAction>
                        ) : (
                          <span className="inline-block size-8" />
                        )}
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
            Showing {from} to {to} of {formatCount(total)} keys
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

      {editing && editDraft ? (
        <EditKeyDialog
          keyRow={editing}
          draft={editDraft}
          plans={plans}
          fieldErrors={editFieldErrors}
          error={editError}
          saving={saving}
          onChange={changeEdit}
          onClose={() => {
            if (!saving) {
              setEditing(null)
              setEditDraft(null)
            }
          }}
          onSubmit={() => void submitEdit()}
        />
      ) : null}

      {dialogOpen ? (
        <IssueKeyDialog
          draft={draft}
          products={products}
          plans={plans}
          issued={issued}
          copied={copied}
          fieldErrors={fieldErrors}
          error={formError}
          saving={saving}
          onChange={changeDraft}
          onClose={() => {
            if (!saving) setDialogOpen(false)
          }}
          onSubmit={() => void submitIssue()}
          onCopy={() => {
            if (issued) void copyText(issued.key)
          }}
          onIssueAnother={openCreate}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title="Revoke key"
          description={`Revoke “${confirm.key}”? It will no longer activate on any machine.`}
          confirmLabel="Revoke Key"
          danger
          pending={actionPending}
          onClose={() => {
            if (!actionPending) setConfirm(null)
          }}
          onConfirm={() => void applyRevoke(confirm)}
        />
      ) : null}
    </div>
  )
}

function planFilterOptions(fromKeys: string[], catalog: CatalogPlanRow[]) {
  return [...new Set([...fromKeys, ...catalog.map((p) => p.code)].filter(Boolean))]
}

function statusTone(status: KeyStatus) {
  if (status === "active") return "success" as const
  if (status === "revoked") return "danger" as const
  if (status === "expired") return "warning" as const
  return "muted" as const
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
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
  return (
    <th className="px-4 py-3 font-medium">
      <SortHeaderButton label={label} column={column} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
    </th>
  )
}

function SortHeaderButton({
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
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn("inline-flex items-center gap-1 uppercase", active ? "text-[#0f1f3d]" : "hover:text-[#5b6478]")}
    >
      {label}
      {active ? sortDir === "asc" ? <ArrowUpIcon className="size-3 shrink-0" /> : <ArrowDownIcon className="size-3 shrink-0" /> : null}
    </button>
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
  icon: typeof KeyRoundIcon
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

function DateCell({ value, empty = "—" }: { value: string | null | undefined; empty?: string }) {
  if (!value) {
    return <span>{empty}</span>
  }
  const [datePart, timePart] = formatDateTime(value)
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-[#5b6478]">{datePart}</span>
      {timePart ? <span className="text-[11px] text-[#8b93a7]">{timePart}</span> : null}
    </span>
  )
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return [iso]
  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return [datePart, `${hh}:${mm}`]
}
