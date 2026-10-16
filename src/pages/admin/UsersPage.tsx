import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  PauseCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldIcon,
  UserCogIcon,
} from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { PaginationLimit, type PageSize } from "@/components/PaginationLimit"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, listTableClass, TableScroll } from "@/components/TableScroll"
import { Input } from "@/components/ui/input"
import {
  createUser,
  listUsers,
  roleLabel,
  toUserError,
  updateUser,
  type AdminUserRow,
} from "@/lib/api/users"
import { formatCount } from "@/lib/format"
import { hasFieldErrors } from "@/lib/validation"
import { draftFromUser, emptyUserDraft, validateUserDraft, type UserDraft, type UserFieldErrors } from "@/lib/schemas/user"
import { cn } from "@/lib/utils"
import { UserDialog } from "@/pages/admin/UserDialog"

type SortKey = "createdAt" | "username" | "name" | "role" | "status" | "lastLogin"
type SortDir = "asc" | "desc"

export function UsersPage() {
  const { token, user } = useAuth()
  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0, admins: 0 })
  const [roles, setRoles] = useState<string[]>(["admin", "agent"])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState<PageSize>(10)
  const [dialog, setDialog] = useState<"create" | "edit" | null>(null)
  const [editing, setEditing] = useState<AdminUserRow | null>(null)
  const [draft, setDraft] = useState<UserDraft>(emptyUserDraft())
  const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<
    | { kind: "update" }
    | { kind: "inactive"; row: AdminUserRow }
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
    setLoading(true)
    listUsers(
      token,
      {
        page,
        limit,
        q: debouncedQuery,
        role: role || undefined,
        status,
        from: fromDate || undefined,
        to: toDate || undefined,
        sort: sortKey,
        dir: sortDir,
      },
      ac.signal,
    )
      .then((body) => {
        setRows(body.users)
        setTotal(body.total)
        setCounts(body.counts)
        setRoles(body.roles?.length ? body.roles : ["admin", "agent"])
        if (body.page !== page) setPage(body.page)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setError("Unable to load admin users.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, reload, page, limit, debouncedQuery, role, status, fromDate, toDate, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const filtersActive = Boolean(query || role || status !== "all" || fromDate || toDate)

  function toggleSort(key: SortKey) {
    setPage(1)
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "createdAt" || key === "lastLogin" ? "desc" : "asc")
  }

  function openCreate() {
    setEditing(null)
    setDraft(emptyUserDraft(roles.includes("agent") ? "agent" : roles[0] || "agent"))
    setFieldErrors({})
    setFormError(null)
    setDialog("create")
  }

  function openEdit(row: AdminUserRow) {
    setEditing(row)
    setDraft(draftFromUser(row))
    setFieldErrors({})
    setFormError(null)
    setDialog("edit")
  }

  function changeDraft(next: UserDraft, field?: keyof UserDraft) {
    setDraft(next)
    setFieldErrors((current) => {
      if (!field) return current
      const nextErrors = validateUserDraft(next, dialog === "edit" ? "edit" : "create")
      const updated = { ...current }
      if (nextErrors[field]) updated[field] = nextErrors[field]
      else delete updated[field]
      return updated
    })
    if (formError) setFormError(null)
  }

  function requestSave() {
    const errors = validateUserDraft(draft, dialog === "edit" ? "edit" : "create")
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
        await createUser(token, {
          username: draft.username.trim(),
          password: draft.password,
          role: draft.role,
          displayName: draft.displayName.trim() || draft.username.trim(),
        })
        toast.success("Admin user added")
      } else if (editing) {
        await updateUser(token, editing.id, {
          role: draft.role,
          displayName: draft.displayName.trim() || editing.displayName || editing.username,
          isActive: draft.isActive,
          ...(draft.password ? { password: draft.password } : {}),
        })
        toast.success("Admin user updated")
      }
      setConfirm(null)
      setDialog(null)
      setReload((n) => n + 1)
    } catch (err) {
      setConfirm(null)
      setFormError(toUserError(err))
    } finally {
      setSaving(false)
    }
  }

  function requestStatusChange(row: AdminUserRow) {
    if (row.id === user?.id) {
      toast.error("You cannot deactivate your own account.")
      return
    }
    if (row.isActive) {
      setConfirm({ kind: "inactive", row })
      return
    }
    void applyStatus(row, true)
  }

  async function applyStatus(row: AdminUserRow, isActive: boolean) {
    if (!token) return
    setActionPending(true)
    try {
      await updateUser(token, row.id, { isActive })
      toast.success(isActive ? "User activated" : "User deactivated")
      setConfirm(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(toUserError(err))
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
          <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">Admin Users</h1>
          <p className="mt-1.5 text-sm text-[#8b93a7]">People who can sign in to this panel. Deactivated users lose their sessions.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
        >
          <PlusIcon className="size-4" />
          Add User
        </button>
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={UserCogIcon} iconClass="bg-[#e8f0ff] text-[#3b6cff]" label="Total Users" value={formatCount(counts.total)} />
        <Kpi icon={CheckCircle2Icon} iconClass="bg-[#e7f8ee] text-[#22c55e]" label="Active" value={formatCount(counts.active)} />
        <Kpi icon={PauseCircleIcon} iconClass="bg-[#eef1f6] text-[#64748b]" label="Inactive" value={formatCount(counts.inactive)} />
        <Kpi icon={ShieldIcon} iconClass="bg-[#fff4d9] text-[#d97706]" label="Admins" value={formatCount(counts.admins)} />
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
              placeholder="Search username, name, role…"
              className="h-10 rounded-xl border-[#e8edf5] bg-white pl-9"
            />
          </div>
          <select
            value={role}
            aria-label="Role"
            onChange={(e) => {
              setRole(e.target.value)
              setPage(1)
            }}
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#0f1f3d]"
          >
            <option value="">All Roles</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {roleLabel(item)}
              </option>
            ))}
          </select>
          <select
            value={status}
            aria-label="Status"
            onChange={(e) => {
              setStatus(e.target.value as typeof status)
              setPage(1)
            }}
            className="h-10 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
            onClick={() => setReload((n) => n + 1)}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e8edf5] text-[#8b93a7] hover:bg-[#f8fafc]"
            aria-label="Refresh users"
          >
            <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
          </button>
        </div>

        <TableScroll>
          <table className={listTableClass}>
            <thead className="sticky top-0 z-10 bg-[#f8fafc] text-left text-[11px] tracking-wide text-[#8b93a7]">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <SortHeader label="User" column="username" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Role" column="role" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Last login" column="lastLogin" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortHeader label="Created" column="createdAt" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="sticky right-0 z-20 min-w-[7rem] bg-[#f8fafc] px-3 py-3 text-right font-medium shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#8b93a7]">
                    {loading
                      ? "Loading admin users…"
                      : filtersActive
                        ? "No admin users match these filters."
                        : "No admin users yet."}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const self = row.id === user?.id
                  return (
                    <tr key={row.id} className="border-t border-[#f0f3f8] hover:bg-[#fafbfe]">
                      <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">{from + index}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0f1f3d]">
                          {row.displayName || row.username}
                          {self ? <span className="ml-2 text-[11px] font-normal text-[#8b93a7]">you</span> : null}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#8b93a7]">{row.username}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge tone={row.role === "admin" ? "warning" : "muted"}>{roleLabel(row.role)}</StatusBadge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge tone={row.isActive ? "success" : "danger"}>
                          {row.isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                        {row.lastLoginAt
                          ? formatStamp(row.lastLoginAt).map((line) => (
                              <span key={line} className="block">
                                {line}
                              </span>
                            ))
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                        {formatStamp(row.createdAt).map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))}
                      </td>
                      <td className="sticky right-0 z-10 min-w-[7rem] bg-white px-3 py-3 shadow-[-12px_0_16px_-10px_rgba(15,31,61,0.18)]">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction label={`Edit ${row.username}`} onClick={() => openEdit(row)}>
                            <PencilIcon className="size-4" />
                          </IconAction>
                          <IconAction
                            label={
                              self
                                ? "You cannot deactivate your own account"
                                : row.isActive
                                  ? `Deactivate ${row.username}`
                                  : `Activate ${row.username}`
                            }
                            onClick={() => requestStatusChange(row)}
                          >
                            {row.isActive ? <PauseCircleIcon className="size-4" /> : <CheckCircle2Icon className="size-4" />}
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </TableScroll>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#f0f3f8] px-4 py-3 text-sm text-[#8b93a7]">
          <p>
            Showing {from} to {to} of {formatCount(total)} users
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
        <UserDialog
          mode={dialog}
          draft={draft}
          roles={roles}
          fieldErrors={fieldErrors}
          error={formError}
          saving={saving}
          disableActive={dialog === "edit" && editing?.id === user?.id}
          onChange={changeDraft}
          onClose={() => setDialog(null)}
          onSubmit={requestSave}
        />
      ) : null}

      {confirm?.kind === "update" ? (
        <ConfirmDialog
          title="Update admin user"
          description={
            editing
              ? `Save changes to “${draft.displayName.trim() || draft.username || editing.username}”?${
                  editing.isActive && !draft.isActive ? " This will deactivate the account and end their sessions." : ""
                }${draft.password ? " Their password will also change." : ""}`
              : "Save these user changes?"
          }
          confirmLabel="Update User"
          pending={saving}
          onClose={closeConfirm}
          onConfirm={() => void save()}
        />
      ) : null}

      {confirm?.kind === "inactive" ? (
        <ConfirmDialog
          title="Deactivate user"
          description={`Deactivate “${confirm.row.displayName || confirm.row.username}”? They will be signed out and cannot log in until you activate them again.`}
          confirmLabel="Deactivate"
          danger
          pending={actionPending}
          onClose={closeConfirm}
          onConfirm={() => void applyStatus(confirm.row, false)}
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
  icon: typeof UserCogIcon
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
