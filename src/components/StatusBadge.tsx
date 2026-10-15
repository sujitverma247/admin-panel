import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const tones = {
  success: "bg-[#e7f8ee] text-[#16a34a]",
  warning: "bg-[#fff4d9] text-[#d97706]",
  danger: "bg-[#fde8e8] text-[#dc2626]",
  muted: "bg-[#eef1f6] text-[#64748b]",
} as const

export function StatusBadge({
  children,
  tone,
}: {
  children: ReactNode
  tone: keyof typeof tones
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
