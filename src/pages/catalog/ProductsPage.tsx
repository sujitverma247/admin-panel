import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  PackageIcon,
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
  createProduct,
  deleteProduct,
  listBrands,
  listProducts,
  toProductDeleteError,
  toProductError,
  updateProduct,
  type BrandRow,
  type ProductRow,
} from "@/lib/api/catalog"
import { formatCount } from "@/lib/format"
import { has, P } from "@/lib/permissions"
import { hasFieldErrors } from "@/lib/validation"
import {
  draftFromProduct,
  emptyProductDraft,
  validateProductDraft,
  type ProductDraft,
  type ProductFieldErrors,
} from "@/lib/schemas/product"
import { cn } from "@/lib/utils"
import { ProductDialog } from "@/pages/catalog/ProductDialog"
import { WebsiteLogo } from "@/pages/catalog/WebsiteLogo"

type SortKey = "name" | "slug" | "website" | "appKey" | "version" | "status" | "createdAt"
type SortDir = "asc" | "desc"

export function ProductsPage() {
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.productWrite)
  const [rows, setRows] = useState<ProductRow[]>([])
  const [websites, setWebsites] = useState<BrandRow[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [brandId, setBrandId] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageSize>(10)
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft())
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<
    | { kind: "update" }
    | { kind: "inactive"; row: ProductRow }
    | { kind: "delete"; row: ProductRow }
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
    listBrands(token, { limit: 100, sort: "name", dir: "asc" }, ac.signal)
      .then((body) => setWebsites(body.brands))
      .catch(() => {
        if (!ac.signal.aborted) setWebsites([])
      })
    return () => ac.abort()
  }, [token, reload])

  useEffect(() => {
    if (!token) return
    const ac = new AbortController()
    setLoading(true)
    listProducts(
      token,
      {
        page,
        limit,
        q: debouncedQuery,
        status,
        brandId: brandId ? Number(brandId) : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: sortKey,
        dir: sortDir,
      },
      ac.signal,
    )
      .then((body) => {
        setRows(body.products)
        setTotal(body.total)
        setCounts(body.counts)
        if (body.page !== page) setPage(body.page)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setError("Unable to load products.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, reload, page, limit, debouncedQuery, status, brandId, fromDate, toDate, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const filtersActive = Boolean(query || status !== "all" || brandId || fromDate || toDate)

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
    setDraft(emptyProductDraft())
    setFieldErrors({})
    setFormError(null)
    setDialog("create")
  }

  function openEdit(row: ProductRow) {
    setEditing(row)
    setDraft(draftFromProduct(row))
    setFieldErrors({})
    setFormError(null)
    setDialog("edit")
  }

  function changeDraft(next: ProductDraft, field?: keyof ProductDraft) {
    setDraft(next)
    setFieldErrors((current) => {
      if (!field) return current
      const nextErrors = validateProductDraft(next, dialog === "edit" ? "edit" : "create")
      const updated = { ...current }
      if (nextErrors[field]) updated[field] = nextErrors[field]
      else delete updated[field]
      if (field === "displayName" && next.slug !== draft.slug) {
        if (nextErrors.slug) updated.slug = nextErrors.slug
        else delete updated.slug
      }
      return updated
    })
    if (formError) setFormError(null)
  }

  function requestSave() {
    const errors = validateProductDraft(draft, dialog === "edit" ? "edit" : "create")
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
      const brandIdValue = Number(draft.brandId)
      if (dialog === "create") {
        await createProduct(token, {
          displayName: draft.displayName.trim(),
          slug: draft.slug.trim(),
          brandId: brandIdValue,
          appKey: draft.appKey.trim(),
          keyPrefix: draft.keyPrefix.trim(),
          userAgentPrefix: draft.userAgentPrefix.trim(),
          latestVersion: draft.latestVersion.trim(),
          downloadUrl: draft.downloadUrl.trim(),
          releaseNotes: draft.releaseNotes.trim(),
        })
        toast.success("Product added")
      } else if (editing) {
        await updateProduct(token, editing.id, {
          displayName: draft.displayName.trim(),
          brandId: brandIdValue,
          keyPrefix: draft.keyPrefix.trim(),
          userAgentPrefix: draft.userAgentPrefix.trim(),
          latestVersion: draft.latestVersion.trim(),
          downloadUrl: draft.downloadUrl.trim(),
          releaseNotes: draft.releaseNotes.trim(),
          isActive: draft.isActive,
        })
        toast.success("Product updated")
      }
      setConfirm(null)
      setDialog(null)
      setReload((n) => n + 1)
    } catch (err) {
      setConfirm(null)
      setFormError(toProductError(err))
    } finally {
      setSaving(false)
    }
  }

  function requestStatusChange(row: ProductRow) {
    if (row.isActive) {
      setConfirm({ kind: "inactive", row })
      return
    }
    void applyStatus(row, true)
  }

  async function applyStatus(row: ProductRow, isActive: boolean) {
    if (!token) return
    setActionPending(true)
    try {
      await updateProduct(token, row.id, { displayName: row.displayName, isActive })
      toast.success(isActive ? "Product activated" : "Product set inactive")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toProductError(err))
    } finally {
      setActionPending(false)
    }
  }

  async function applyDelete(row: ProductRow) {
    if (!token) return
    setActionPending(true)
    try {
      await deleteProduct(token, row.id)
      toast.success("Product deleted")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toProductDeleteError(err))
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
          <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">Products</h1>
          <p className="mt-1.5 text-sm text-[#8b93a7]">Manage products for licensing and updates</p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
          >
            <PlusIcon className="size-4" />
            Add Product
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi icon={PackageIcon} iconClass="bg-[#e8f0ff] text-[#3b6cff]" label="Total Products" value={formatCount(counts.total)} />
        <Kpi icon={CheckCircle2Icon} iconClass="bg-[#e7f8ee] text-[#22c55e]" label="Active Products" value={formatCount(counts.active)} />
        <Kpi
          icon={PauseCircleIcon}
          iconClass="bg-[#eef1f6] text-[#64748b]"
          label="Inactive Products"
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
              placeholder="Search products…"
              className="h-10 rounded-xl border-[#e8edf5] bg-white pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status)
              setPage(1)
            }}
            aria-label="Product status"
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value)
              setPage(1)
            }}
            aria-label="Website"
            className="h-10 max-w-[14rem] rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="">All Websites</option>
            {websites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
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
            {formatCount(total)} {total === 1 ? "product" : "products"}
          </p>
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e8edf5] text-[#8b93a7] hover:bg-[#f8fafc]"
            aria-label="Refresh products"
          >
            <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
          </button>
        </div>

        <TableScroll>
          <table className={listTableClass}>
            <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <SortHeader label="Name" column="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Slug" column="slug" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Website" column="website" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="App Key" column="appKey" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Version" column="version" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
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
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#8b93a7]">
                    {loading
                      ? "Loading products…"
                      : filtersActive
                        ? "No products match this search."
                        : "No products yet"}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-[#f0f3f8]">
                    <td className="px-4 py-3 text-[#8b93a7]">{from + index}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[#0f1f3d]">{row.displayName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{row.slug}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.brandName ? (
                        <span className="inline-flex items-center gap-2">
                          <WebsiteLogo name={row.brandName} logoUrl={row.brandLogoUrl} seed={row.brandId ?? 0} />
                          <span className="text-[#0f1f3d]">{row.brandName}</span>
                        </span>
                      ) : (
                        <span className="text-[#8b93a7]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap text-[#5b6478]">{row.appKey}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{row.latestVersion || "—"}</td>
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
            Showing {from} to {to} of {formatCount(total)} products
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
        <ProductDialog
          mode={dialog}
          draft={draft}
          websites={websites}
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
          title="Update product"
          description={
            editing
              ? `Save changes to “${draft.displayName.trim() || editing.displayName}”?${
                  editing.isActive && !draft.isActive ? " This will also set the product inactive." : ""
                }`
              : "Save these product changes?"
          }
          confirmLabel="Update Product"
          pending={saving}
          onClose={closeConfirm}
          onConfirm={() => void save()}
        />
      ) : null}

      {confirm?.kind === "inactive" ? (
        <ConfirmDialog
          title="Set product inactive"
          description={`Set “${confirm.row.displayName}” inactive? It will stay in the list but will be marked inactive.`}
          confirmLabel="Set Inactive"
          pending={actionPending}
          onClose={closeConfirm}
          onConfirm={() => void applyStatus(confirm.row, false)}
        />
      ) : null}

      {confirm?.kind === "delete" ? (
        <ConfirmDialog
          title="Delete product"
          description={
            (confirm.row.licenseCount ?? 0) > 0
              ? `“${confirm.row.displayName}” has ${confirm.row.licenseCount} license(s) and cannot be deleted. Set it inactive instead.`
              : `Delete “${confirm.row.displayName}”? This cannot be undone.`
          }
          confirmLabel={(confirm.row.licenseCount ?? 0) > 0 ? "Close" : "Delete Product"}
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
  icon: typeof PackageIcon
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
