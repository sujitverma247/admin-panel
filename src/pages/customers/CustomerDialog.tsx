import { useEffect, type ReactNode } from "react"
import { XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CUSTOMER_EMAIL_MAX,
  CUSTOMER_NAME_MAX,
  CUSTOMER_NOTES_MAX,
  CUSTOMER_PHONE_MAX,
  type CustomerDraft,
  type CustomerFieldErrors,
} from "@/lib/schemas/customer"
import { cn } from "@/lib/utils"

export function CustomerDialog({
  mode,
  draft,
  fieldErrors,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit"
  draft: CustomerDraft
  fieldErrors: CustomerFieldErrors
  error: string | null
  saving: boolean
  onChange: (next: CustomerDraft, field?: keyof CustomerDraft) => void
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

  const title = mode === "create" ? "Add Customer" : "Edit Customer"

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
        aria-labelledby="customer-dialog-title"
        className="flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,31,61,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f3f8] px-6 py-5">
          <div>
            <h2 id="customer-dialog-title" className="text-lg font-semibold text-[#0f1f3d]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#8b93a7]">
              {mode === "create"
                ? "Create a buyer record. Email is the unique identity."
                : "Update this customer’s details. Changing email also updates linked keys."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex size-8 items-center justify-center rounded-lg text-[#8b93a7] hover:bg-[#f4f6fb] disabled:opacity-50"
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
            <Field
              id="customer-email"
              label="Email"
              required
              hint="Unique identity. Stored lowercase."
              error={fieldErrors.email}
              value={draft.email}
              max={CUSTOMER_EMAIL_MAX}
            >
              <Input
                id="customer-email"
                type="email"
                autoComplete="off"
                value={draft.email}
                maxLength={CUSTOMER_EMAIL_MAX}
                aria-invalid={Boolean(fieldErrors.email)}
                onChange={(e) => onChange({ ...draft, email: e.target.value }, "email")}
                placeholder="buyer@example.com"
                className={fieldClass(fieldErrors.email)}
              />
            </Field>

            <Field
              id="customer-name"
              label="Name"
              hint={`Optional. ${CUSTOMER_NAME_MAX} characters.`}
              error={fieldErrors.displayName}
              value={draft.displayName}
              max={CUSTOMER_NAME_MAX}
            >
              <Input
                id="customer-name"
                value={draft.displayName}
                maxLength={CUSTOMER_NAME_MAX}
                aria-invalid={Boolean(fieldErrors.displayName)}
                onChange={(e) => onChange({ ...draft, displayName: e.target.value }, "displayName")}
                placeholder="Display name"
                className={fieldClass(fieldErrors.displayName)}
              />
            </Field>

            <Field
              id="customer-phone"
              label="Phone"
              hint={`Optional. ${CUSTOMER_PHONE_MAX} characters.`}
              error={fieldErrors.phone}
              value={draft.phone}
              max={CUSTOMER_PHONE_MAX}
            >
              <Input
                id="customer-phone"
                type="tel"
                autoComplete="off"
                value={draft.phone}
                maxLength={CUSTOMER_PHONE_MAX}
                aria-invalid={Boolean(fieldErrors.phone)}
                onChange={(e) => onChange({ ...draft, phone: e.target.value }, "phone")}
                placeholder="+44 7700 900123"
                className={fieldClass(fieldErrors.phone)}
              />
            </Field>

            <Field
              id="customer-notes"
              label="Notes"
              hint={`Optional. ${CUSTOMER_NOTES_MAX} characters.`}
              error={fieldErrors.notes}
              value={draft.notes}
              max={CUSTOMER_NOTES_MAX}
            >
              <textarea
                id="customer-notes"
                value={draft.notes}
                maxLength={CUSTOMER_NOTES_MAX}
                rows={4}
                aria-invalid={Boolean(fieldErrors.notes)}
                onChange={(e) => onChange({ ...draft, notes: e.target.value }, "notes")}
                placeholder="Internal notes"
                className={cn(
                  "w-full rounded-xl border border-[#e8edf5] bg-white px-3 py-2 text-sm text-[#0f1f3d] placeholder:text-[#b0b7c6] outline-none focus-visible:border-[#3b6cff] focus-visible:ring-2 focus-visible:ring-[#3b6cff]/20",
                  fieldErrors.notes && "border-[#fecaca] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20",
                )}
              />
            </Field>

            {mode === "edit" ? (
              <label className="flex items-center justify-between rounded-xl border border-[#e8edf5] px-3 py-2.5 text-sm text-[#0f1f3d]">
                <span>
                  <span className="block font-medium">Active customer</span>
                  <span className="text-xs text-[#8b93a7]">Inactive customers stay in the list but are marked inactive.</span>
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
              {saving ? "Saving…" : mode === "create" ? "Add Customer" : "Save Customer"}
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
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#1b2a4a]">
        {label}
        {required ? <span className="text-[#dc2626]"> *</span> : null}
      </Label>
      {children}
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={`${id}-error`} className="text-[13px] text-[#dc2626]" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="min-w-0 text-[12px] text-[#8b93a7]">{hint}</p>
        ) : (
          <span />
        )}
        {max != null ? (
          <p
            className={cn("shrink-0 text-[12px] tabular-nums", tooLong ? "text-[#dc2626]" : "text-[#8b93a7]")}
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
