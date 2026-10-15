import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"

export function CopyableText({
  value,
  empty = "—",
  label,
  className,
}: {
  value?: string | null
  empty?: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const text = value?.trim() ?? ""
  if (!text) return <span className={className}>{empty}</span>

  async function copy() {
    try {
      await writeClipboard(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <button
      type="button"
      title={copied ? "Copied" : `Copy ${label ?? text}`}
      aria-label={copied ? "Copied" : `Copy ${label ?? text}`}
      onClick={() => void copy()}
      className={cn("inline-flex min-w-0 max-w-full items-start gap-1.5 text-left hover:text-[#3b6cff]", className)}
    >
      <span className="min-w-0 break-all">{text}</span>
      {copied ? (
        <span className="rounded-full bg-[#e7f8ee] px-2 py-0.5 text-[10px] font-medium text-[#16a34a]">Copied</span>
      ) : null}
    </button>
  )
}

export async function writeClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return
    }
  } catch {
    // Some browsers deny the Clipboard API; the textarea fallback still works from a click.
  }
  const field = document.createElement("textarea")
  field.value = value
  field.setAttribute("readonly", "")
  field.style.position = "fixed"
  field.style.left = "-9999px"
  document.body.appendChild(field)
  field.select()
  const ok = document.execCommand("copy")
  document.body.removeChild(field)
  if (!ok) throw new Error("copy failed")
}
