import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function ListPageFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">{children}</div>
}

export function TableScroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("table-scroll min-h-0 min-w-0 flex-1 overflow-auto", className)}>{children}</div>
}

export const listTableClass = "w-max min-w-full text-left text-[13px]"
