import { cn } from "@/lib/utils"

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center", compact ? "justify-center gap-0" : "gap-2.5")}>
      <svg viewBox="0 0 32 32" className="size-9 shrink-0 text-[#3b6cff]" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16 3.2 27 8v8.3c0 6.4-4.3 12.1-11 13.8C9.3 28.4 5 22.7 5 16.3V8l11-4.8Z"
        />
        <path fill="#fff" d="m13.1 16.7-2.4-2.4-1.4 1.4 3.8 3.8 7.1-7.1-1.4-1.4z" />
      </svg>
      <div
        className={cn(
          "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          compact ? "ml-0 max-w-0 opacity-0" : "ml-0 max-w-[140px] opacity-100",
        )}
      >
        <p className="text-[0.98rem] leading-none font-semibold tracking-tight text-[#0b1f5c]">
          MasterServer
        </p>
        <p className="mt-0.5 text-[0.7rem] text-[#8b93a7]">Admin Panel</p>
      </div>
    </div>
  )
}
