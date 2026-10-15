import { useEffect, useState, type ReactNode } from "react"
import { XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BrandRow } from "@/lib/api/catalog"
import {
  PRODUCT_APP_KEY_MAX,
  PRODUCT_APP_KEY_MIN,
  PRODUCT_KEY_PREFIX_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_NAME_MIN,
  PRODUCT_NAME_RANGE,
  PRODUCT_NOTES_MAX,
  PRODUCT_SLUG_MAX,
  PRODUCT_SLUG_MIN,
  PRODUCT_SLUG_RANGE,
  PRODUCT_UA_MAX,
  PRODUCT_UA_MIN,
  PRODUCT_URL_MAX,
  PRODUCT_URL_MIN,
  PRODUCT_VERSION_MAX,
  type ProductDraft,
  type ProductFieldErrors,
} from "@/lib/schemas/product"
import { toWebsiteSlug } from "@/lib/websiteSlug"
import { cn } from "@/lib/utils"

export function ProductDialog({
  mode,
  draft,
  websites,
  fieldErrors,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit"
  draft: ProductDraft
  websites: BrandRow[]
  fieldErrors: ProductFieldErrors
  error: string | null
  saving: boolean
  onChange: (next: ProductDraft, field?: keyof ProductDraft) => void
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
  const title = mode === "create" ? "Add Product" : "Edit Product"

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
        aria-labelledby="product-dialog-title"
        className="flex max-h-[min(44rem,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,31,61,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f3f8] px-6 py-5">
          <div className="min-w-0">
            <h2 id="product-dialog-title" className="text-lg font-semibold text-[#0f1f3d]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#8b93a7]">
              {mode === "create" ? "Create a product for licensing and updates." : "Update this product’s details."}
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
            <Field
              id="product-name"
              label="Product Name"
              required
              hint={`${PRODUCT_NAME_RANGE} characters.`}
              error={fieldErrors.displayName}
              value={draft.displayName}
              min={PRODUCT_NAME_MIN}
              max={PRODUCT_NAME_MAX}
            >
              <Input
                id="product-name"
                value={draft.displayName}
                autoFocus
                minLength={PRODUCT_NAME_MIN}
                maxLength={PRODUCT_NAME_MAX}
                aria-invalid={Boolean(fieldErrors.displayName)}
                onChange={(e) => {
                  const displayName = e.target.value
                  onChange(
                    {
                      ...draft,
                      displayName,
                      slug: mode === "create" && !slugTouched ? toWebsiteSlug(displayName) : draft.slug,
                    },
                    "displayName",
                  )
                }}
                placeholder="Acme VPN"
                className={fieldClass(fieldErrors.displayName)}
              />
            </Field>

            <Field
              id="product-slug"
              label="Product Slug"
              required={mode === "create"}
              hint={
                mode === "edit"
                  ? "Slug cannot be changed after create."
                  : `${PRODUCT_SLUG_RANGE} characters. Letters, numbers, and hyphens only. Example: acme-vpn`
              }
              error={fieldErrors.slug}
              value={draft.slug}
              min={PRODUCT_SLUG_MIN}
              max={PRODUCT_SLUG_MAX}
            >
              <Input
                id="product-slug"
                value={draft.slug}
                disabled={mode === "edit"}
                minLength={PRODUCT_SLUG_MIN}
                maxLength={PRODUCT_SLUG_MAX}
                aria-invalid={Boolean(fieldErrors.slug)}
                onChange={(e) => {
                  setSlugTouched(true)
                  onChange({ ...draft, slug: e.target.value.toLowerCase() }, "slug")
                }}
                placeholder="acme-vpn"
                className={fieldClass(fieldErrors.slug)}
              />
            </Field>

            <div className="space-y-1.5">
              <Label htmlFor="product-website" className="text-sm font-medium text-[#1b2a4a]">
                Website
                <span className="text-[#dc2626]"> *</span>
              </Label>
              <select
                id="product-website"
                value={draft.brandId}
                aria-invalid={Boolean(fieldErrors.brandId)}
                onChange={(e) => onChange({ ...draft, brandId: e.target.value }, "brandId")}
                className={cn(
                  "h-10 w-full rounded-xl border bg-white px-3 text-sm text-[#0f1f3d] outline-none focus-visible:ring-3",
                  fieldErrors.brandId
                    ? "border-[#fecaca] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20"
                    : "border-[#e8edf5] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20",
                )}
              >
                <option value="" disabled>
                  Select website
                </option>
                {websites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {fieldErrors.brandId ? (
                <p id="product-website-error" className="text-[13px] text-[#dc2626]" role="alert">
                  {fieldErrors.brandId}
                </p>
              ) : (
                <p className="text-[12px] text-[#8b93a7]">
                  {websites.length === 0
                    ? "Add a website first, then attach this product to it."
                    : "Choose the website this product belongs to."}
                </p>
              )}
            </div>

            <Field
              id="product-app-key"
              label="App Key"
              required
              hint={`${PRODUCT_APP_KEY_MIN}–${PRODUCT_APP_KEY_MAX} characters.`}
              error={fieldErrors.appKey}
              value={draft.appKey}
              min={PRODUCT_APP_KEY_MIN}
              max={PRODUCT_APP_KEY_MAX}
            >
              <Input
                id="product-app-key"
                value={draft.appKey}
                minLength={PRODUCT_APP_KEY_MIN}
                maxLength={PRODUCT_APP_KEY_MAX}
                aria-invalid={Boolean(fieldErrors.appKey)}
                onChange={(e) => onChange({ ...draft, appKey: e.target.value }, "appKey")}
                placeholder="APP-KEY-001"
                className={fieldClass(fieldErrors.appKey)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="product-key-prefix"
                label="Key Prefix"
                hint={`Optional. At most ${PRODUCT_KEY_PREFIX_MAX} characters. Example: ACME`}
                error={fieldErrors.keyPrefix}
                value={draft.keyPrefix}
                max={PRODUCT_KEY_PREFIX_MAX}
              >
                <Input
                  id="product-key-prefix"
                  value={draft.keyPrefix}
                  maxLength={PRODUCT_KEY_PREFIX_MAX}
                  aria-invalid={Boolean(fieldErrors.keyPrefix)}
                  onChange={(e) => onChange({ ...draft, keyPrefix: e.target.value }, "keyPrefix")}
                  placeholder="ACME"
                  className={fieldClass(fieldErrors.keyPrefix)}
                />
              </Field>
              <Field
                id="product-version"
                label="Latest Version"
                hint={`Optional. At most ${PRODUCT_VERSION_MAX} characters.`}
                error={fieldErrors.latestVersion}
                value={draft.latestVersion}
                max={PRODUCT_VERSION_MAX}
              >
                <Input
                  id="product-version"
                  value={draft.latestVersion}
                  maxLength={PRODUCT_VERSION_MAX}
                  aria-invalid={Boolean(fieldErrors.latestVersion)}
                  onChange={(e) => onChange({ ...draft, latestVersion: e.target.value }, "latestVersion")}
                  placeholder="1.0.0"
                  className={fieldClass(fieldErrors.latestVersion)}
                />
              </Field>
            </div>

            <Field
              id="product-ua"
              label="User Agent Prefix"
              required
              hint={`${PRODUCT_UA_MIN}–${PRODUCT_UA_MAX} characters.`}
              error={fieldErrors.userAgentPrefix}
              value={draft.userAgentPrefix}
              min={PRODUCT_UA_MIN}
              max={PRODUCT_UA_MAX}
            >
              <Input
                id="product-ua"
                value={draft.userAgentPrefix}
                minLength={PRODUCT_UA_MIN}
                maxLength={PRODUCT_UA_MAX}
                aria-invalid={Boolean(fieldErrors.userAgentPrefix)}
                onChange={(e) => onChange({ ...draft, userAgentPrefix: e.target.value }, "userAgentPrefix")}
                placeholder="AcmeVPN/"
                className={fieldClass(fieldErrors.userAgentPrefix)}
              />
            </Field>

            <p className="rounded-xl border border-[#e8edf5] bg-[#f8fafc] px-3 py-2.5 text-[12px] text-[#8b93a7]">
              HMAC secret is a server credential. The seed product uses <span className="font-medium text-[#5b6478]">PRODUCT_HMAC_SECRET</span> in
              environment variables. New products get a generated secret that is never shown in this form.
            </p>

            <Field
              id="product-download"
              label="Download URL"
              hint={`Optional. ${PRODUCT_URL_MIN}–${PRODUCT_URL_MAX} characters. Must start with http:// or https://.`}
              error={fieldErrors.downloadUrl}
              value={draft.downloadUrl}
              min={PRODUCT_URL_MIN}
              max={PRODUCT_URL_MAX}
            >
              <Input
                id="product-download"
                type="url"
                value={draft.downloadUrl}
                maxLength={PRODUCT_URL_MAX}
                aria-invalid={Boolean(fieldErrors.downloadUrl)}
                onChange={(e) => onChange({ ...draft, downloadUrl: e.target.value }, "downloadUrl")}
                placeholder="https://example.com/app.exe"
                className={fieldClass(fieldErrors.downloadUrl)}
              />
            </Field>

            <Field
              id="product-notes"
              label="Release Notes"
              hint={`Optional. At most ${PRODUCT_NOTES_MAX} characters.`}
              error={fieldErrors.releaseNotes}
              value={draft.releaseNotes}
              max={PRODUCT_NOTES_MAX}
            >
              <textarea
                id="product-notes"
                value={draft.releaseNotes}
                maxLength={PRODUCT_NOTES_MAX}
                rows={3}
                aria-invalid={Boolean(fieldErrors.releaseNotes)}
                onChange={(e) => onChange({ ...draft, releaseNotes: e.target.value }, "releaseNotes")}
                placeholder="What changed in this version"
                className={cn(
                  "w-full resize-y rounded-xl border border-[#e8edf5] bg-white px-3 py-2 text-sm text-[#0f1f3d] outline-none placeholder:text-[#b0b7c6] focus-visible:border-[#3b6cff] focus-visible:ring-3 focus-visible:ring-[#3b6cff]/20",
                  fieldErrors.releaseNotes && "border-[#fecaca] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20",
                )}
              />
            </Field>

            {mode === "edit" ? (
              <label className="flex items-center justify-between rounded-xl border border-[#e8edf5] px-3 py-2.5 text-sm text-[#0f1f3d]">
                <span>
                  <span className="block font-medium">Active product</span>
                  <span className="text-xs text-[#8b93a7]">Inactive products stay in the list but are marked inactive.</span>
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
              {saving ? "Saving…" : mode === "create" ? "Add Product" : "Save Product"}
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
          <p id={`${id}-error`} className="min-w-0 text-[13px] text-[#dc2626]" role="alert">
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
