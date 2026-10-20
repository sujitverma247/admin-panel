import { useEffect, type ReactNode } from "react"
import { XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CatalogPlanRow } from "@/lib/api/catalog"
import type { KeyRow } from "@/lib/api/keys"
import {
  KEY_MACHINES_MAX,
  KEY_MACHINES_MIN,
  KEY_NOTES_MAX,
  manualKeyPlanOptions,
  type EditKeyDraft,
  type EditKeyFieldErrors,
} from "@/lib/schemas/key"
import { cn } from "@/lib/utils"

export function EditKeyDialog({
  keyRow,
  draft,
  plans,
  fieldErrors,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  keyRow: KeyRow
  draft: EditKeyDraft
  plans: CatalogPlanRow[]
  fieldErrors: EditKeyFieldErrors
  error: string | null
  saving: boolean
  onChange: (next: EditKeyDraft, field?: keyof EditKeyDraft) => void
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

  const planOptions = manualKeyPlanOptions(plans)
  const plansWithCurrent = planOptions.some((p) => p.code === draft.planType)
    ? planOptions
    : [...planOptions, { id: 0, code: draft.planType, displayName: draft.planType, durationDays: 0, defaultMaxMachines: Number(draft.maxMachines) || 3, isActive: true }]

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
        aria-labelledby="edit-key-title"
        className="flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,31,61,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f3f8] px-6 py-5">
          <div className="min-w-0">
            <h2 id="edit-key-title" className="text-lg font-semibold text-[#0f1f3d]">
              Edit Key
            </h2>
            <p className="mt-1 font-mono text-sm break-all text-[#5b6478]">{keyRow.key}</p>
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
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <Field id="edit-email" label="Customer email" hint="Leave blank to clear." error={fieldErrors.customerEmail}>
              <Input
                id="edit-email"
                type="email"
                autoComplete="off"
                value={draft.customerEmail}
                aria-invalid={Boolean(fieldErrors.customerEmail)}
                onChange={(e) => onChange({ ...draft, customerEmail: e.target.value }, "customerEmail")}
                placeholder="customer@example.com"
                className={fieldClass(fieldErrors.customerEmail)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-plan" className="text-sm font-medium text-[#1b2a4a]">
                  Plan
                  <span className="text-[#dc2626]"> *</span>
                </Label>
                <select
                  id="edit-plan"
                  value={draft.planType}
                  aria-invalid={Boolean(fieldErrors.planType)}
                  onChange={(e) => {
                    const code = e.target.value
                    const plan = plansWithCurrent.find((p) => p.code === code)
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
                  {plansWithCurrent.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.displayName}
                    </option>
                  ))}
                </select>
                {fieldErrors.planType ? <p className="text-[13px] text-[#dc2626]">{fieldErrors.planType}</p> : null}
                <p className="text-[12px] text-[#8b93a7]">Changing the plan updates expiry from the purchase date.</p>
              </div>
              <Field
                id="edit-machines"
                label="Max devices"
                required
                hint={`${KEY_MACHINES_MIN}–${KEY_MACHINES_MAX} devices.`}
                error={fieldErrors.maxMachines}
              >
                <Input
                  id="edit-machines"
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

            <Field id="edit-notes" label="Notes" value={draft.notes} max={KEY_NOTES_MAX} hint="Optional internal note." error={fieldErrors.notes}>
              <Input
                id="edit-notes"
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
              {saving ? "Saving…" : "Save changes"}
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
  const showCount = value != null && max != null && id !== "edit-machines"
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
