import { cn } from "@/lib/utils"

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center", compact ? "justify-center gap-0" : "gap-2.5")}>
      <img
        src="/logo.png"
        alt=""
        className="size-10 shrink-0 object-contain"
      />
      <div
        className={cn(
          "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          compact ? "ml-0 max-w-0 opacity-0" : "ml-0 max-w-[180px] opacity-100",
        )}
      >
        <p className="text-[0.92rem] leading-none font-semibold tracking-tight text-[#0b1f5c]">
          Europe Digi Server
        </p>
        <p className="mt-0.5 text-[0.7rem] text-[#8b93a7]">Admin Panel</p>
      </div>
    </div>
  )
}
