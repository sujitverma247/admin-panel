import { useState } from "react"
import { Outlet } from "react-router"
import { BrandMark } from "@/layout/BrandMark"
import { Sidebar } from "@/layout/Sidebar"
import { Topbar } from "@/layout/Topbar"
import { cn } from "@/lib/utils"

export function AppShell() {
  const [expanded, setExpanded] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024,
  )

  return (
    <div className="light flex h-full flex-col overflow-hidden bg-[#eef2f7] text-[#1b2a4a]">
      <header className="z-30 flex h-[68px] shrink-0 items-center border-b border-[#e8edf5] bg-white">
        <div
          className={cn(
            "flex h-full shrink-0 items-center overflow-hidden transition-[width,padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            expanded ? "w-[240px] px-5" : "w-[72px] justify-center px-0",
          )}
        >
          <BrandMark compact={!expanded} />
        </div>
        <Topbar
          expanded={expanded}
          onMenuClick={() => setExpanded((open) => !open)}
        />
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          expanded={expanded}
          onNavigate={() => {
            if (window.innerWidth < 1024) setExpanded(false)
          }}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 py-4 lg:px-7 lg:py-5">
          <div className="table-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
