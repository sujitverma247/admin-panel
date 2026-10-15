import { useEffect, useState, type ReactNode } from "react"
import { GlobeIcon, ImageIcon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  WEBSITE_EMAIL_MAX,
  WEBSITE_EMAIL_MIN,
  WEBSITE_EMAIL_RANGE,
  WEBSITE_NAME_MAX,
  WEBSITE_NAME_MIN,
  WEBSITE_NAME_RANGE,
  WEBSITE_SLUG_MAX,
  WEBSITE_SLUG_MIN,
  WEBSITE_SLUG_RANGE,
  WEBSITE_URL_MAX,
  WEBSITE_URL_MIN,
  WEBSITE_URL_RANGE,
  type WebsiteDraft,
  type WebsiteFieldErrors,
} from "@/lib/schemas/website"
import { toWebsiteSlug } from "@/lib/websiteSlug"
import { cn } from "@/lib/utils"
import { WebsiteLogo } from "@/pages/catalog/WebsiteLogo"

export function WebsiteDialog({
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
  draft: WebsiteDraft
  fieldErrors: WebsiteFieldErrors
  error: string | null
  saving: boolean
  onChange: (next: WebsiteDraft, field?: keyof WebsiteDraft) => void
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

  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const title = mode === "create" ? "Add Website" : "Edit Website"

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
        aria-labelledby="website-dialog-title"
        className="flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,31,61,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f3f8] px-6 py-5">
          <div>
            <h2 id="website-dialog-title" className="text-lg font-semibold text-[#0f1f3d]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#8b93a7]">
              {mode === "create"
                ? "Create a website used by your products."
                : "Update this website’s details."}
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
            <div className="flex min-w-0 items-start gap-4 overflow-hidden rounded-xl border border-[#e8edf5] bg-[#f8fafc] p-3">
              <WebsiteLogo name={draft.name} logoUrl={draft.logoUrl} className="size-14 shrink-0 rounded-2xl text-lg" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-[#0f1f3d]" title={draft.name.trim() || undefined}>
                  {draft.name.trim() || "Website logo"}
                </p>
                <p className="mt-0.5 text-xs text-[#8b93a7]">
                  Paste an https image URL. If it cannot load, the initial is shown instead.
                </p>
              </div>
            </div>

            <Field
              id="website-name"
              label="Website Name"
              required
              hint={`${WEBSITE_NAME_RANGE} characters.`}
              error={fieldErrors.name}
              value={draft.name}
              min={WEBSITE_NAME_MIN}
              max={WEBSITE_NAME_MAX}
            >
              <Input
                id="website-name"
                value={draft.name}
                autoFocus
                minLength={WEBSITE_NAME_MIN}
                maxLength={WEBSITE_NAME_MAX}
                aria-invalid={Boolean(fieldErrors.name)}
                onChange={(e) => {
                  const name = e.target.value
                  onChange(
                    {
                      ...draft,
                      name,
                      slug: mode === "create" && !slugTouched ? toWebsiteSlug(name) : draft.slug,
                    },
                    "name",
                  )
                }}
                placeholder="Acme Security"
                className={fieldClass(fieldErrors.name)}
              />
            </Field>

            <Field
              id="website-slug"
              label="Website Slug"
              required={mode === "create"}
              hint={
                mode === "edit"
                  ? "Slug cannot be changed after create."
                  : `${WEBSITE_SLUG_RANGE} characters. Letters, numbers, and hyphens only. Example: acme-security`
              }
              error={fieldErrors.slug}
              value={draft.slug}
              min={WEBSITE_SLUG_MIN}
              max={WEBSITE_SLUG_MAX}
            >
              <Input
                id="website-slug"
                value={draft.slug}
                disabled={mode === "edit"}
                minLength={WEBSITE_SLUG_MIN}
                maxLength={WEBSITE_SLUG_MAX}
                aria-invalid={Boolean(fieldErrors.slug)}
                onChange={(e) => {
                  setSlugTouched(true)
                  onChange({ ...draft, slug: e.target.value.toLowerCase() }, "slug")
                }}
                placeholder="acme-security"
                className={fieldClass(fieldErrors.slug)}
              />
            </Field>

            <Field
              id="website-url"
              label="Website URL"
              hint={`Optional. ${WEBSITE_URL_RANGE} characters. Must start with http:// or https://.`}
              error={fieldErrors.websiteUrl}
              value={draft.websiteUrl}
              min={WEBSITE_URL_MIN}
              max={WEBSITE_URL_MAX}
            >
              <div className="relative">
                <GlobeIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9aa3b5]" />
                <Input
                  id="website-url"
                  type="url"
                  value={draft.websiteUrl}
                  minLength={WEBSITE_URL_MIN}
                  maxLength={WEBSITE_URL_MAX}
                  aria-invalid={Boolean(fieldErrors.websiteUrl)}
                  onChange={(e) => onChange({ ...draft, websiteUrl: e.target.value }, "websiteUrl")}
                  placeholder="https://example.com"
                  className={cn("pl-9", fieldClass(fieldErrors.websiteUrl))}
                />
              </div>
            </Field>

            <Field
              id="website-logo-url"
              label="Website Logo URL"
              hint={`Optional. ${WEBSITE_URL_RANGE} characters. Direct link to a PNG, SVG, or JPG.`}
              error={fieldErrors.logoUrl}
              value={draft.logoUrl}
              min={WEBSITE_URL_MIN}
              max={WEBSITE_URL_MAX}
            >
              <div className="relative">
                <ImageIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9aa3b5]" />
                <Input
                  id="website-logo-url"
                  type="url"
                  value={draft.logoUrl}
                  minLength={WEBSITE_URL_MIN}
                  maxLength={WEBSITE_URL_MAX}
                  aria-invalid={Boolean(fieldErrors.logoUrl)}
                  onChange={(e) => onChange({ ...draft, logoUrl: e.target.value }, "logoUrl")}
                  placeholder="https://example.com/logo.png"
                  className={cn("pl-9", fieldClass(fieldErrors.logoUrl))}
                />
              </div>
            </Field>

            <Field
              id="website-support-email"
              label="Support Email"
              hint={`Optional. ${WEBSITE_EMAIL_RANGE} characters.`}
              error={fieldErrors.supportEmail}
              value={draft.supportEmail}
              min={WEBSITE_EMAIL_MIN}
              max={WEBSITE_EMAIL_MAX}
            >
              <Input
                id="website-support-email"
                type="email"
                value={draft.supportEmail}
                minLength={WEBSITE_EMAIL_MIN}
                maxLength={WEBSITE_EMAIL_MAX}
                aria-invalid={Boolean(fieldErrors.supportEmail)}
                onChange={(e) => onChange({ ...draft, supportEmail: e.target.value }, "supportEmail")}
                placeholder="support@example.com"
                className={fieldClass(fieldErrors.supportEmail)}
              />
            </Field>

            {mode === "edit" ? (
              <label className="flex items-center justify-between rounded-xl border border-[#e8edf5] px-3 py-2.5 text-sm text-[#0f1f3d]">
                <span>
                  <span className="block font-medium">Active website</span>
                  <span className="text-xs text-[#8b93a7]">Inactive websites stay in the list but are marked inactive.</span>
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
              {saving ? "Saving…" : mode === "create" ? "Add Website" : "Save Website"}
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
