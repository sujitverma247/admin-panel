import { useEffect, useState, type ReactNode } from "react"
import { XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProductRow } from "@/lib/api/catalog"
import {
  PLAN_CODE_MAX,
  PLAN_CODE_MIN,
  PLAN_CODE_RANGE,
  PLAN_DURATION_MAX,
  PLAN_DURATION_MIN,
  PLAN_EXTERNAL_ID_MAX,
  PLAN_GATEWAYS,
  PLAN_MACHINES_MAX,
  PLAN_MACHINES_MIN,
  PLAN_NAME_MAX,
  PLAN_NAME_MIN,
  PLAN_NAME_RANGE,
  toPlanCode,
  type PlanDraft,
  type PlanFieldErrors,
} from "@/lib/schemas/plan"
import { cn } from "@/lib/utils"

export function PlanDialog({
  mode,
  draft,
  products,
  gateways,
  fieldErrors,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit"
  draft: PlanDraft
  products: ProductRow[]
  gateways: string[]
  fieldErrors: PlanFieldErrors
  error: string | null
  saving: boolean
  onChange: (next: PlanDraft, field?: keyof PlanDraft) => void
  onClose: () => void
  onSubmit: () => void
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, saving])

  const [codeTouched, setCodeTouched] = useState(mode === "edit")
  const title = mode === "create" ? "Add Plan" : "Edit Plan"
  const gatewayOptions = [...new Set([...PLAN_GATEWAYS, ...gateways, draft.gateway].filter(Boolean))]

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
        aria-labelledby="plan-dialog-title"
        className="flex max-h-[min(42rem,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,31,61,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f3f8] px-6 py-5">
          <div className="min-w-0">
            <h2 id="plan-dialog-title" className="text-lg font-semibold text-[#0f1f3d]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#8b93a7]">
              Price is managed on the payment gateway. Here you map a product to the gateway’s plan ID.
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
              <Label htmlFor="plan-product" className="text-sm font-medium text-[#1b2a4a]">
                Product
                <span className="text-[#dc2626]"> *</span>
              </Label>
              <select
                id="plan-product"
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
                  Select product
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.displayName}
                  </option>
                ))}
              </select>
              {fieldErrors.productId ? (
                <p className="text-[13px] text-[#dc2626]" role="alert">
                  {fieldErrors.productId}
                </p>
              ) : (
                <p className="text-[12px] text-[#8b93a7]">The product this gateway plan belongs to.</p>
              )}
            </div>

            <Field
              id="plan-name"
              label="Plan Name"
              required
              hint={`${PLAN_NAME_RANGE} characters.`}
              error={fieldErrors.displayName}
              value={draft.displayName}
              min={PLAN_NAME_MIN}
              max={PLAN_NAME_MAX}
            >
              <Input
                id="plan-name"
                value={draft.displayName}
                autoFocus
                minLength={PLAN_NAME_MIN}
                maxLength={PLAN_NAME_MAX}
                aria-invalid={Boolean(fieldErrors.displayName)}
                onChange={(e) => {
                  const displayName = e.target.value
                  onChange(
                    {
                      ...draft,
                      displayName,
                      code: mode === "create" && !codeTouched ? toPlanCode(displayName) : draft.code,
                    },
                    "displayName",
                  )
                }}
                placeholder="1 Year"
                className={fieldClass(fieldErrors.displayName)}
              />
            </Field>

            <Field
              id="plan-code"
              label="Plan Code"
              required={mode === "create"}
              hint={
                mode === "edit"
                  ? "Code cannot be changed after create. Licenses keep this code."
                  : `${PLAN_CODE_RANGE} characters. Example: 1year, monthly, lifetime`
              }
              error={fieldErrors.code}
              value={draft.code}
              min={PLAN_CODE_MIN}
              max={PLAN_CODE_MAX}
            >
              <Input
                id="plan-code"
                value={draft.code}
                disabled={mode === "edit"}
                minLength={PLAN_CODE_MIN}
                maxLength={PLAN_CODE_MAX}
                aria-invalid={Boolean(fieldErrors.code)}
                onChange={(e) => {
                  setCodeTouched(true)
                  onChange({ ...draft, code: e.target.value.toLowerCase() }, "code")
                }}
                placeholder="1year"
                className={fieldClass(fieldErrors.code)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="plan-gateway" className="text-sm font-medium text-[#1b2a4a]">
                  Payment Gateway
                  <span className="text-[#dc2626]"> *</span>
                </Label>
                <select
                  id="plan-gateway"
                  value={draft.gateway}
                  aria-invalid={Boolean(fieldErrors.gateway)}
                  onChange={(e) => onChange({ ...draft, gateway: e.target.value.toLowerCase() }, "gateway")}
                  className={cn(
                    "h-10 w-full rounded-xl border bg-white px-3 text-sm text-[#0f1f3d] outline-none focus-visible:ring-3",
                    fieldErrors.gateway
                      ? "border-[#fecaca] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20"
                      : "border-[#e8edf5] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20",
                  )}
                >
                  {gatewayOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {fieldErrors.gateway ? (
                  <p className="text-[13px] text-[#dc2626]" role="alert">
                    {fieldErrors.gateway}
                  </p>
                ) : (
                  <p className="text-[12px] text-[#8b93a7]">Where the product is sold. Price is set there.</p>
                )}
              </div>
              <Field
                id="plan-external"
                label="Gateway Plan ID"
                required
                hint="Freemius plan ID (e.g. 68452) or Dodo product ID (e.g. pdt_…)."
                error={fieldErrors.externalPlanId}
                value={draft.externalPlanId}
                min={1}
                max={PLAN_EXTERNAL_ID_MAX}
              >
                <Input
                  id="plan-external"
                  value={draft.externalPlanId}
                  maxLength={PLAN_EXTERNAL_ID_MAX}
                  aria-invalid={Boolean(fieldErrors.externalPlanId)}
                  onChange={(e) => onChange({ ...draft, externalPlanId: e.target.value.trim() }, "externalPlanId")}
                  placeholder="68452"
                  className={fieldClass(fieldErrors.externalPlanId)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="plan-duration"
                label="Duration (days)"
                required
                hint={`Used when a key is activated. Example: 365, 36500.`}
                error={fieldErrors.durationDays}
              >
                <Input
                  id="plan-duration"
                  type="number"
                  inputMode="numeric"
                  min={PLAN_DURATION_MIN}
                  max={PLAN_DURATION_MAX}
                  step={1}
                  value={draft.durationDays}
                  aria-invalid={Boolean(fieldErrors.durationDays)}
                  onChange={(e) => onChange({ ...draft, durationDays: e.target.value }, "durationDays")}
                  placeholder="365"
                  className={fieldClass(fieldErrors.durationDays)}
                />
              </Field>
              <Field
                id="plan-machines"
                label="Max Machines"
                required
                hint={`Required. ${PLAN_MACHINES_MIN}–${PLAN_MACHINES_MAX} devices.`}
                error={fieldErrors.defaultMaxMachines}
              >
                <Input
                  id="plan-machines"
                  type="number"
                  inputMode="numeric"
                  min={PLAN_MACHINES_MIN}
                  max={PLAN_MACHINES_MAX}
                  step={1}
                  value={draft.defaultMaxMachines}
                  aria-invalid={Boolean(fieldErrors.defaultMaxMachines)}
                  onChange={(e) => onChange({ ...draft, defaultMaxMachines: e.target.value }, "defaultMaxMachines")}
                  placeholder="3"
                  className={fieldClass(fieldErrors.defaultMaxMachines)}
                />
              </Field>
            </div>

            {mode === "edit" ? (
              <label className="flex items-center justify-between rounded-xl border border-[#e8edf5] px-3 py-2.5 text-sm text-[#0f1f3d]">
                <span>
                  <span className="block font-medium">Active mapping</span>
                  <span className="text-xs text-[#8b93a7]">Inactive mappings are not used for checkout or webhooks.</span>
                </span>
                <input
                  type="checkbox"
                  className="size-4 accent-[#3b6cff]"
                  checked={draft.isActive}
                  onChange={(e) => onChange({ ...draft, isActive: e.target.checked }, "isActive")}
                />
              </label>
            ) : null}

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
              {saving ? "Saving…" : mode === "create" ? "Add Plan" : "Save Plan"}
            </button>
          </div>
        </form>
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
  min,
  max,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  value?: string
  min?: number
  max?: number
  children: ReactNode
}) {
  const count = value?.length ?? 0
  const tooShort = min != null && count > 0 && count < min
  const tooLong = max != null && count >= max
  const showCount = value != null && max != null && id !== "plan-duration" && id !== "plan-machines"
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#1b2a4a]">
        {label}
        {required ? <span className="text-[#dc2626]"> *</span> : null}
      </Label>
      {children}
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} className="min-w-0 text-[13px] text-[#dc2626]" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="min-w-0 text-[12px] text-[#8b93a7]">{hint}</p>
        ) : (
          <span />
        )}
        {showCount ? (
          <p
            className={cn(
              "shrink-0 text-[12px] tabular-nums",
              tooShort || tooLong ? "text-[#dc2626]" : "text-[#8b93a7]",
            )}
            aria-label={`${count} of ${max} characters`}
          >
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
