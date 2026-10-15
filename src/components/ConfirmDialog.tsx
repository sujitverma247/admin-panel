import { useEffect } from "react"
import { cn } from "@/lib/utils"

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  pending = false,
  danger = false,
  onClose,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel?: string
  pending?: boolean
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, pending])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f1f3d]/40 p-4"
      onClick={() => {
        if (!pending) onClose()
      }}
    >
      <div
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="w-full max-w-md rounded-2xl border border-[#e8edf5] bg-white p-6 shadow-[0_16px_40px_rgba(15,31,61,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[#0f1f3d]">
          {title}
        </h2>
        <p id="confirm-dialog-desc" className="mt-2 text-sm leading-relaxed text-[#5b6478]">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="h-10 rounded-xl border border-[#e8edf5] px-4 text-sm text-[#5b6478] hover:bg-[#f8fafc] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={cn(
              "h-10 rounded-xl px-4 text-sm font-medium text-white disabled:opacity-60",
              danger ? "bg-[#dc2626] hover:bg-[#b91c1c]" : "bg-[#3b6cff] hover:bg-[#2f5ef0]",
            )}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
