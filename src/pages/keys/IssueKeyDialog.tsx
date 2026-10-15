import { useEffect, type ReactNode } from "react"
import { CheckIcon, CopyIcon, XIcon } from "lucide-react"
import { CopyableText } from "@/components/CopyableText"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CatalogPlanRow, ProductRow } from "@/lib/api/catalog"
import type { IssuedKey } from "@/lib/api/keys"
import {
  KEY_MACHINES_MAX,
  KEY_MACHINES_MIN,
  KEY_NAME_MAX,
  KEY_NOTES_MAX,
  type IssueKeyDraft,
  type IssueKeyFieldErrors,
} from "@/lib/schemas/key"
import { cn } from "@/lib/utils"

export function IssueKeyDialog({
  draft,
  products,
  plans,
  issued,
  copied,
  fieldErrors,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
  onCopy,
  onIssueAnother,
}: {
  draft: IssueKeyDraft
  products: ProductRow[]
  plans: CatalogPlanRow[]
  issued: IssuedKey | null
  copied: boolean
  fieldErrors: IssueKeyFieldErrors
  error: string | null
  saving: boolean
  onChange: (next: IssueKeyDraft, field?: keyof IssueKeyDraft) => void
  onClose: () => void
  onSubmit: () => void
  onCopy: () => void
  onIssueAnother: () => void
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, saving])

  const planOptions = plans.length > 0 ? plans : [{ id: 0, code: "1year", displayName: "1 Year", durationDays: 365, defaultMaxMachines: 3, isActive: true }]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f3d]/40 p-4"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-key-title"
        className="flex max-h-[min(42rem,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,31,61,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f3f8] px-6 py-5">
          <div className="min-w-0">
            <h2 id="issue-key-title" className="text-lg font-semibold text-[#0f1f3d]">
              Issue Key
            </h2>
            <p className="mt-1 text-sm text-[#8b93a7]">
              Generate a retail key for a customer. The plan term starts on purchase.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#8b93a7] hover:bg-[#f4f6fb] disabled:opacity-50"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {issued ? (
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] p-4">
              <p className="text-[11px] tracking-wide text-[#8b93a7] uppercase">New license key</p>
              <div className="mt-2 flex items-start gap-2">
                <button
                  type="button"
                  onClick={onCopy}
                  title={copied ? "Copied" : "Copy key"}
                  className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#3b6cff] hover:bg-white"
                  aria-label={copied ? "Copied" : "Copy key"}
                >
                  {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                  {copied ? (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#0f1f3d] px-1.5 py-0.5 text-[10px] leading-none font-medium whitespace-nowrap text-white">
                      Copied
                    </span>
                  ) : null}
                </button>
                <button type="button" onClick={onCopy} title={copied ? "Copied" : "Copy key"} className="font-mono text-base break-all text-[#0f1f3d] hover:text-[#3b6cff]">
                  {issued.key}
                </button>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#8b93a7]">Product</dt>
                <dd className="text-[#0f1f3d]">{issued.productName}</dd>
              </div>
              <div>
                <dt className="text-[#8b93a7]">Customer</dt>
                <dd className="truncate text-[#0f1f3d]">{issued.name || issued.email}</dd>
              </div>
              <div>
                <dt className="text-[#8b93a7]">Email</dt>
                <dd className="text-[#0f1f3d]">
                  <CopyableText value={issued.email} label="email" className="text-[#0f1f3d]" />
                </dd>
              </div>
              <div>
                <dt className="text-[#8b93a7]">Plan</dt>
                <dd className="text-[#0f1f3d]">{issued.planType}</dd>
              </div>
              <div>
                <dt className="text-[#8b93a7]">Devices</dt>
                <dd className="text-[#0f1f3d]">{issued.maxMachines}</dd>
              </div>
              <div>
                <dt className="text-[#8b93a7]">Purchased</dt>
                <dd className="text-[#0f1f3d]">{formatIssuedDate(issued.purchasedAt)}</dd>
              </div>
              <div>
                <dt className="text-[#8b93a7]">Activated</dt>
                <dd className="text-[#0f1f3d]">{formatIssuedDate(issued.activatedAt)}</dd>
              </div>
              <div>
                <dt className="text-[#8b93a7]">Expires</dt>
                <dd className="text-[#0f1f3d]">{formatIssuedDate(issued.expiresAt)}</dd>
              </div>
            </dl>
            <p className="text-xs text-[#8b93a7]">Give this key to the customer. It only works in {issued.productName}.</p>
            <div className="flex justify-end gap-2 border-t border-[#f0f3f8] pt-4">
              <button
                type="button"
                onClick={onIssueAnother}
                className="h-10 rounded-xl border border-[#e8edf5] px-4 text-sm text-[#5b6478] hover:bg-[#f8fafc]"
              >
                Issue another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-xl bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            className="flex min-h-0 flex-1 flex-col"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
            <div className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="issue-product" className="text-sm font-medium text-[#1b2a4a]">
                  Product
                  <span className="text-[#dc2626]"> *</span>
                </Label>
                <select
                  id="issue-product"
                  value={draft.productId}
                  aria-invalid={Boolean(fieldErrors.productId)}
                  onChange={(e) => onChange({ ...draft, productId: e.target.value }, "productId")}
                  className={cn(
                    "h-10 w-full rounded-xl border bg-white px-3 text-sm text-[#0f1f3d] outline-none focus-visible:ring-3",
                    fieldErrors.productId
                      ? "border-[#fecaca] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20"
                      : "border-[#e8edf5] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20",
                  )}
                >
                  <option value="" disabled>
                    Select a product
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.displayName}
                    </option>
                  ))}
                </select>
                {fieldErrors.productId ? (
                  <p className="text-[13px] text-[#dc2626]">{fieldErrors.productId}</p>
                ) : (
                  <p className="text-[12px] text-[#8b93a7]">The key is minted with this product’s prefix and only works there.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="issue-email" label="Customer email" required hint="Required. The key is emailed to this address." error={fieldErrors.customerEmail}>
                  <Input
                    id="issue-email"
                    type="email"
                    autoComplete="off"
                    value={draft.customerEmail}
                    aria-invalid={Boolean(fieldErrors.customerEmail)}
                    onChange={(e) => onChange({ ...draft, customerEmail: e.target.value }, "customerEmail")}
                    placeholder="customer@example.com"
                    className={fieldClass(fieldErrors.customerEmail)}
                  />
                </Field>
                <Field id="issue-name" label="Customer name" value={draft.name} max={KEY_NAME_MAX} hint="Optional. Stored on the customer profile." error={fieldErrors.name}>
                  <Input
                    id="issue-name"
                    value={draft.name}
                    aria-invalid={Boolean(fieldErrors.name)}
                    onChange={(e) => onChange({ ...draft, name: e.target.value }, "name")}
                    placeholder="Full name"
                    maxLength={KEY_NAME_MAX}
                    className={fieldClass(fieldErrors.name)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="issue-plan" className="text-sm font-medium text-[#1b2a4a]">
                    Plan
                    <span className="text-[#dc2626]"> *</span>
                  </Label>
                  <select
                    id="issue-plan"
                    value={draft.planType}
                    aria-invalid={Boolean(fieldErrors.planType)}
                    onChange={(e) => {
                      const code = e.target.value
                      const plan = planOptions.find((p) => p.code === code)
                      onChange(
                        {
                          ...draft,
                          planType: code,
                          maxMachines: String(plan?.defaultMaxMachines ?? draft.maxMachines),
                        },
                        "planType",
                      )
                    }}
                    className={cn(
                      "h-10 w-full rounded-xl border bg-white px-3 text-sm text-[#0f1f3d] outline-none focus-visible:ring-3",
                      fieldErrors.planType
                        ? "border-[#fecaca] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20"
                        : "border-[#e8edf5] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20",
                    )}
                  >
                    {planOptions.map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.displayName}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.planType ? <p className="text-[13px] text-[#dc2626]">{fieldErrors.planType}</p> : null}
                </div>
                <Field
                  id="issue-machines"
                  label="Max devices"
                  required
                  hint={`${KEY_MACHINES_MIN}–${KEY_MACHINES_MAX} devices.`}
                  error={fieldErrors.maxMachines}
                >
                  <Input
                    id="issue-machines"
                    type="number"
                    inputMode="numeric"
                    min={KEY_MACHINES_MIN}
                    max={KEY_MACHINES_MAX}
                    step={1}
                    value={draft.maxMachines}
                    aria-invalid={Boolean(fieldErrors.maxMachines)}
                    onChange={(e) => onChange({ ...draft, maxMachines: e.target.value }, "maxMachines")}
                    className={fieldClass(fieldErrors.maxMachines)}
                  />
                </Field>
              </div>

              <Field id="issue-notes" label="Notes" value={draft.notes} max={KEY_NOTES_MAX} hint="Optional internal note." error={fieldErrors.notes}>
                <Input
                  id="issue-notes"
                  value={draft.notes}
                  aria-invalid={Boolean(fieldErrors.notes)}
                  onChange={(e) => onChange({ ...draft, notes: e.target.value }, "notes")}
                  placeholder="Internal note"
                  maxLength={KEY_NOTES_MAX}
                  className={fieldClass(fieldErrors.notes)}
                />
              </Field>

              {error ? (
                <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#f0f3f8] px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-10 rounded-xl border border-[#e8edf5] px-4 text-sm text-[#5b6478] hover:bg-[#f8fafc] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-xl bg-[#3b6cff] px-4 text-sm font-medium text-white hover:bg-[#2f5ef0] disabled:opacity-60"
              >
                {saving ? "Generating…" : "Generate Key"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  value,
  max,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  value?: string
  max?: number
  children: ReactNode
}) {
  const count = value?.length ?? 0
  const tooLong = max != null && count >= max
  const showCount = value != null && max != null && id !== "issue-machines"
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#1b2a4a]">
        {label}
        {required ? <span className="text-[#dc2626]"> *</span> : null}
      </Label>
      {children}
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p className="min-w-0 text-[13px] text-[#dc2626]" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="min-w-0 text-[12px] text-[#8b93a7]">{hint}</p>
        ) : (
          <span />
        )}
        {showCount ? (
          <p className={cn("shrink-0 text-[12px] tabular-nums", tooLong ? "text-[#dc2626]" : "text-[#8b93a7]")}>
            {count}/{max}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function fieldClass(error?: string) {
  return cn(
    "h-10 rounded-xl border-[#e8edf5] bg-white text-sm text-[#0f1f3d] placeholder:text-[#b0b7c6] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20",
    error && "border-[#fecaca] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20",
  )
}

function formatIssuedDate(iso: string | null | undefined) {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
