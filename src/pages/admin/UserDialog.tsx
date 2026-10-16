import { useEffect, type ReactNode } from "react"
import { XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { roleLabel } from "@/lib/api/users"
import {
  USER_NAME_MAX,
  USER_PASSWORD_MAX,
  USER_PASSWORD_MIN,
  USER_PASSWORD_RANGE,
  USER_USERNAME_MAX,
  USER_USERNAME_RANGE,
  type UserDraft,
  type UserFieldErrors,
} from "@/lib/schemas/user"
import { cn } from "@/lib/utils"

export function UserDialog({
  mode,
  draft,
  roles,
  fieldErrors,
  error,
  saving,
  disableActive,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit"
  draft: UserDraft
  roles: string[]
  fieldErrors: UserFieldErrors
  error: string | null
  saving: boolean
  disableActive?: boolean
  onChange: (next: UserDraft, field?: keyof UserDraft) => void
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

  const title = mode === "create" ? "Add Admin User" : "Edit Admin User"
  const roleOptions = roles.length > 0 ? roles : ["admin", "agent"]

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
        aria-labelledby="user-dialog-title"
        className="flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_16px_40px_rgba(15,31,61,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f0f3f8] px-6 py-5">
          <div>
            <h2 id="user-dialog-title" className="text-lg font-semibold text-[#0f1f3d]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#8b93a7]">
              {mode === "create"
                ? "Create a panel login. Username cannot be changed later."
                : "Update this user’s name, role, or password."}
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
              id="user-username"
              label="Username"
              required
              hint={`${USER_USERNAME_RANGE} characters. Letters, numbers, dots, hyphens, underscores.`}
              error={fieldErrors.username}
              value={draft.username}
              max={USER_USERNAME_MAX}
            >
              <Input
                id="user-username"
                autoComplete="off"
                disabled={mode === "edit" || saving}
                value={draft.username}
                maxLength={USER_USERNAME_MAX}
                onChange={(e) => onChange({ ...draft, username: e.target.value }, "username")}
                className={fieldClass(fieldErrors.username)}
              />
            </Field>

            <Field
              id="user-display-name"
              label="Display name"
              hint={`At most ${USER_NAME_MAX} characters. Shown in the header.`}
              error={fieldErrors.displayName}
              value={draft.displayName}
              max={USER_NAME_MAX}
            >
              <Input
                id="user-display-name"
                value={draft.displayName}
                maxLength={USER_NAME_MAX}
                onChange={(e) => onChange({ ...draft, displayName: e.target.value }, "displayName")}
                className={fieldClass(fieldErrors.displayName)}
              />
            </Field>

            <Field id="user-role" label="Role" required error={fieldErrors.role}>
              <select
                id="user-role"
                value={draft.role}
                onChange={(e) => onChange({ ...draft, role: e.target.value }, "role")}
                className={cn(fieldClass(fieldErrors.role), "w-full px-3")}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="user-password"
              label="Password"
              required={mode === "create"}
              hint={
                mode === "create"
                  ? `${USER_PASSWORD_RANGE} characters.`
                  : `Leave blank to keep the current password. ${USER_PASSWORD_MIN}+ characters if changing.`
              }
              error={fieldErrors.password}
              value={draft.password}
              max={USER_PASSWORD_MAX}
            >
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                value={draft.password}
                maxLength={USER_PASSWORD_MAX}
                onChange={(e) => onChange({ ...draft, password: e.target.value }, "password")}
                className={fieldClass(fieldErrors.password)}
              />
            </Field>

            {mode === "edit" ? (
              <label className="flex items-center gap-2 text-sm text-[#0f1f3d]">
                <input
                  type="checkbox"
                  className="size-4 accent-[#3b6cff]"
                  checked={draft.isActive}
                  disabled={disableActive}
                  onChange={(e) => onChange({ ...draft, isActive: e.target.checked }, "isActive")}
                />
                Active
                {disableActive ? (
                  <span className="text-xs text-[#8b93a7]">You cannot deactivate your own account.</span>
                ) : null}
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
              {saving ? "Saving…" : mode === "create" ? "Add User" : "Save User"}
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
    "h-10 rounded-xl border-[#e8edf5] bg-white text-sm text-[#0f1f3d] placeholder:text-[#b0b7c6] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20 disabled:bg-[#f8fafc] disabled:text-[#8b93a7]",
    error && "border-[#fecaca] focus-visible:border-[#dc2626] focus-visible:ring-[#dc2626]/20",
  )
}
