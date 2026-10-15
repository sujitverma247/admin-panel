import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function SearchBar({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full max-w-[540px]", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-[#9aa3b5]" />
      <Input
        type="search"
        placeholder="Search by order, customer, key, ticket..."
        className="h-10 rounded-full border-[#e4e8f0] bg-[#f4f6fb] pr-4 pl-10 text-sm text-[#1b2a4a] shadow-none placeholder:text-[#b0b7c6] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20"
      />
    </div>
  )
}
