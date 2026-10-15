import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowLeftIcon, CheckCircle2Icon, KeyRoundIcon, PauseCircleIcon, PencilIcon } from "lucide-react"
import { toast } from "react-toastify"
import { useAuth } from "@/auth/AuthProvider"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { CopyableText } from "@/components/CopyableText"
import { StatusBadge } from "@/components/StatusBadge"
import { ListPageFrame, listTableClass, TableScroll } from "@/components/TableScroll"
import { getCustomer, toCustomerError, updateCustomer, type CustomerDetail } from "@/lib/api/customers"
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

export function CustomerDetailPage() {
  const { id } = useParams()
  const customerId = Number(id)
  const { token, user } = useAuth()
  const canWrite = has(user?.permissions, P.customerWrite)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<CustomerDraft>(emptyCustomerDraft())
  const [fieldErrors, setFieldErrors] = useState<CustomerFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!token || !Number.isInteger(customerId) || customerId <= 0) return
    const ac = new AbortController()
    setLoading(true)
    getCustomer(token, customerId, ac.signal)
      .then((body) => {
        setCustomer(body.customer)
        setError(null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setCustomer(null)
        setError("Unable to load this customer.")
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [token, customerId, reload])

  function openEdit() {
    if (!customer) return
    setDraft(draftFromCustomer(customer))
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
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
    setConfirm(true)
  }

  async function save() {
    if (!token || !customer) return
    setSaving(true)
    setFormError(null)
    try {
      await updateCustomer(token, customer.id, {
        email: draft.email.trim(),
        displayName: draft.displayName.trim(),
        phone: draft.phone.trim(),
        notes: draft.notes.trim(),
        isActive: draft.isActive,
      })
      toast.success("Customer updated")
      setConfirm(false)
      setDialogOpen(false)
      setReload((n) => n + 1)
    } catch (err) {
      setConfirm(false)
      setFormError(toCustomerError(err))
    } finally {
      setSaving(false)
    }
  }

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return (
      <div className="p-6 text-sm text-[#8b93a7]">
        Invalid customer.{" "}
        <Link to="/customers" className="text-[#3b6cff] hover:underline">
          Back to customers
        </Link>
      </div>
    )
  }

  return (
    <ListPageFrame>
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <div>
          <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-[#3b6cff] hover:underline">
            <ArrowLeftIcon className="size-3.5" />
            Customers
          </Link>
          <h1 className="mt-2 text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">
            {customer?.displayName || customer?.email || "Customer"}
          </h1>
          {customer ? (
            <p className="mt-1.5 text-sm text-[#8b93a7]">
              Source {formatSource(customer.source)} · created {formatCreatedAt(customer.createdAt).join(" ")}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-[#8b93a7]">{loading ? "Loading…" : "Not found"}</p>
          )}
        </div>
        {canWrite && customer ? (
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
          >
            <PencilIcon className="size-4" />
            Edit Customer
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}

      {customer ? (
        <>
          <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <p className="text-xs text-[#8b93a7]">Email</p>
              <CopyableText value={customer.email} label="email" className="mt-1 font-medium text-[#0f1f3d]" />
            </div>
            <div className="rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <p className="text-xs text-[#8b93a7]">Phone</p>
              <CopyableText value={customer.phone} label="phone" className="mt-1 font-medium text-[#0f1f3d]" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f0ff] text-[#3b6cff]">
                <KeyRoundIcon className="size-5" />
              </div>
              <div>
                <p className="text-xs text-[#8b93a7]">Keys</p>
                <p className="text-[1.45rem] leading-none font-semibold text-[#0f1f3d]">{formatCount(customer.licenseCount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  customer.isActive ? "bg-[#e7f8ee] text-[#22c55e]" : "bg-[#eef1f6] text-[#64748b]",
                )}
              >
                {customer.isActive ? <CheckCircle2Icon className="size-5" /> : <PauseCircleIcon className="size-5" />}
              </div>
              <div className="space-y-1">
                <StatusBadge tone={customer.isActive ? "success" : "danger"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </StatusBadge>
                <div>
                  <StatusBadge tone={customer.acceptedCurrent ? "success" : "muted"}>
                    {customer.acceptedCurrent ? "Policy accepted" : "Policy pending"}
                  </StatusBadge>
                </div>
              </div>
            </div>
          </div>

          {customer.notes ? (
            <p className="mt-4 shrink-0 rounded-2xl border border-[#e8edf5] bg-white px-4 py-3 text-sm text-[#5b6478]">
              {customer.notes}
            </p>
          ) : null}

          <section className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
            <div className="flex shrink-0 items-center justify-between border-b border-[#f0f3f8] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Keys</h2>
              <p className="text-sm text-[#8b93a7]">{formatCount(customer.licenses.length)}</p>
            </div>
            <TableScroll>
              <table className={listTableClass}>
                <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Key</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Activated</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.licenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#8b93a7]">
                        No keys linked to this customer.
                      </td>
                    </tr>
                  ) : (
                    customer.licenses.map((license) => (
                      <tr key={license.id} className="border-t border-[#f0f3f8]">
                        <td className="px-4 py-3 font-mono whitespace-nowrap text-[#0f1f3d]">
                          <CopyableText value={license.key} label="key" className="font-mono text-[#0f1f3d]" />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{license.planType}</td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={license.isRevoked ? "danger" : license.isActive ? "success" : "muted"}>
                            {license.isRevoked ? "Revoked" : license.isActive ? "Active" : "Inactive"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                          {license.activatedAt ? formatCreatedAt(license.activatedAt).join(" ") : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                          {license.expiresAt ? formatCreatedAt(license.expiresAt).join(" ") : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableScroll>
          </section>

          <section className="mt-4 shrink-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
            <div className="flex items-center justify-between border-b border-[#f0f3f8] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#0f1f3d]">Refund policy</h2>
              <p className="text-sm text-[#8b93a7]">{formatCount(customer.acceptances.length)}</p>
            </div>
            <TableScroll className="max-h-64 flex-none">
              <table className={listTableClass}>
                <thead className="sticky top-0 z-10 bg-white text-[11px] tracking-wide text-[#8b93a7] uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Version</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Accepted</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.acceptances.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-sm text-[#8b93a7]">
                        No policy acceptance recorded.
                      </td>
                    </tr>
                  ) : (
                    customer.acceptances.map((row) => (
                      <tr key={row.id} className="border-t border-[#f0f3f8]">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-[#0f1f3d]">{row.policyVersion}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#5b6478]">{formatSource(row.source)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#8b93a7]">
                          {formatCreatedAt(row.acceptedAt).join(" ")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableScroll>
          </section>
        </>
      ) : null}

      {dialogOpen ? (
        <CustomerDialog
          mode="edit"
          draft={draft}
          fieldErrors={fieldErrors}
          error={formError}
          saving={saving}
          onChange={changeDraft}
          onClose={() => setDialogOpen(false)}
          onSubmit={requestSave}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title="Update customer"
          description={`Save changes to “${draft.email.trim() || customer?.email}”?`}
          confirmLabel="Update Customer"
          pending={saving}
          onClose={() => {
            if (!saving) setConfirm(false)
          }}
          onConfirm={() => void save()}
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
