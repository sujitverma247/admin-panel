import { CalendarIcon, ChevronDownIcon, RefreshCwIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AnalyticsQuery } from "@/lib/api/analytics"
import { formatRange } from "@/lib/format"
import { cn } from "@/lib/utils"

export type RangePreset = "7d" | "30d" | "365d" | "custom"

export const RANGE_PRESETS: { id: Exclude<RangePreset, "custom">; label: string; days: number }[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 1 month", days: 30 },
  { id: "365d", label: "Last 1 year", days: 365 },
]

export function presetQuery(preset: Exclude<RangePreset, "custom">): AnalyticsQuery {
  const match = RANGE_PRESETS.find((item) => item.id === preset)!
  return { days: match.days }
}

export function presetLabel(preset: RangePreset, customFrom: string, customTo: string) {
  if (preset === "custom" && customFrom && customTo) {
    return formatRange(customFrom, customTo) || "Custom"
  }
  if (preset === "custom") return "Custom"
  return RANGE_PRESETS.find((item) => item.id === preset)?.label ?? "Last 7 days"
}

export function todayUtc() {
  return new Date().toISOString().slice(0, 10)
}

export function daysAgoUtc(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - (days - 1))
  return d.toISOString().slice(0, 10)
}

export function DashboardRange({
  preset,
  customFrom,
  customTo,
  pickingCustom,
  loading,
  onPreset,
  onStartCustom,
  onCustomFrom,
  onCustomTo,
  onApplyCustom,
  onRefresh,
}: {
  preset: RangePreset
  customFrom: string
  customTo: string
  pickingCustom: boolean
  loading: boolean
  onPreset: (preset: Exclude<RangePreset, "custom">) => void
  onStartCustom: () => void
  onCustomFrom: (value: string) => void
  onCustomTo: (value: string) => void
  onApplyCustom: () => void
  onRefresh: () => void
}) {
  const max = todayUtc()
  const customReady = customFrom.length > 0 && customTo.length > 0 && customFrom <= customTo

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] shadow-[0_1px_2px_rgba(16,42,96,0.04)] hover:bg-[#f8fafc]"
      >
        <RefreshCwIcon className={cn("size-4 text-[#8b93a7]", loading && "animate-spin")} />
        Refresh
      </button>

      {pickingCustom ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
          <input
            type="date"
            value={customFrom}
            max={customTo || max}
            onChange={(e) => onCustomFrom(e.target.value)}
            className="h-8 rounded-lg border border-[#e8edf5] px-2 text-sm text-[#0f1f3d] outline-none"
            aria-label="From date"
          />
          <span className="text-xs text-[#8b93a7]">to</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            max={max}
            onChange={(e) => onCustomTo(e.target.value)}
            className="h-8 rounded-lg border border-[#e8edf5] px-2 text-sm text-[#0f1f3d] outline-none"
            aria-label="To date"
          />
          <button
            type="button"
            disabled={!customReady || loading}
            onClick={onApplyCustom}
            className="h-8 rounded-lg bg-[#3b6cff] px-3 text-sm font-medium text-white disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-3 text-sm text-[#5b6478] shadow-[0_1px_2px_rgba(16,42,96,0.04)] outline-none hover:bg-[#f8fafc]">
            <CalendarIcon className="size-4 text-[#8b93a7]" />
            <span className="max-w-[16rem] truncate">{presetLabel(preset, customFrom, customTo)}</span>
            <ChevronDownIcon className="size-4 text-[#8b93a7]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {RANGE_PRESETS.map((item) => (
              <DropdownMenuItem key={item.id} onSelect={() => onPreset(item.id)}>
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={() => onStartCustom()}>Custom</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
