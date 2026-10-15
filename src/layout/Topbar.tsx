import { BellIcon, LogOutIcon, MenuIcon } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchBar } from "@/components/SearchBar"

export function Topbar({
  expanded,
  onMenuClick,
}: {
  expanded: boolean
  onMenuClick: () => void
}) {
  const { user, logout } = useAuth()
  const initial = (user?.displayName || user?.username || "A").charAt(0).toUpperCase()

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 pr-4 pl-2 sm:pr-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 text-[#6b7385] hover:bg-[#f4f6fb] hover:text-[#1b2a4a]"
        onClick={onMenuClick}
        aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
        aria-expanded={expanded}
      >
        <MenuIcon className="size-5" />
      </Button>

      <SearchBar className="hidden min-w-0 flex-1 sm:block" />

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-full text-[#6b7385] hover:bg-[#f4f6fb]"
          aria-label="Notifications"
        >
          <BellIcon className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#ef4444] ring-2 ring-white" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 outline-none hover:bg-[#f4f6fb] sm:pr-3">
            <Avatar size="default" className="size-9 bg-[#3b6cff] text-white after:border-transparent">
              <AvatarFallback className="bg-[#3b6cff] text-sm font-semibold text-white">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] leading-tight font-semibold text-[#0f1f3d]">
                {user?.displayName || user?.username}
              </span>
              <span className="block text-[11px] leading-tight text-[#8b93a7]">
                {roleLabel(user?.role)}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel(user?.role)}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function roleLabel(role: string | undefined) {
  if (role === "admin") return "Administrator"
  if (role === "agent") return "Agent"
  return role ?? ""
}
