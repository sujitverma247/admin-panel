import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import { ChevronDownIcon } from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { has } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { navItems, type NavItem } from "@/layout/nav"

export function Sidebar({
  expanded,
  onNavigate,
  className,
}: {
  expanded: boolean
  onNavigate?: () => void
  className?: string
}) {
  const { user } = useAuth()
  const visible = navItems.filter(
    (item) => !item.permission || has(user?.permissions, item.permission),
  )

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col overflow-hidden bg-[#0b1628] py-3 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        expanded ? "w-[240px]" : "w-[72px]",
        className,
      )}
    >
      <nav
        className={cn(
          "no-scrollbar flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto transition-[padding] duration-300",
          expanded ? "px-3" : "px-2",
        )}
      >
        {visible.map((item) =>
          item.children ? (
            <TelemetryGroup
              key={item.label}
              item={item}
              expanded={expanded}
              onNavigate={onNavigate}
            />
          ) : (
            <div key={item.label}>
              {item.dividerBefore ? (
                <div
                  className={cn(
                    "my-3 border-t border-white/10 transition-[margin] duration-300",
                    expanded ? "mx-2" : "mx-1",
                  )}
                />
              ) : null}
              <NavLink
                to={item.to!}
                end={item.to === "/"}
                title={expanded ? undefined : item.label}
                aria-label={item.label}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-lg py-2.5 text-[13px] font-medium transition-[background-color,color,padding,gap,justify-content] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    expanded ? "gap-3 px-3" : "justify-center px-0",
                    isActive
                      ? "bg-[#3b6cff] text-white shadow-[0_6px_16px_rgba(59,108,255,0.35)]"
                      : "text-white/70 hover:bg-white/8 hover:text-white",
                  )
                }
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                <NavLabel expanded={expanded}>{item.label}</NavLabel>
              </NavLink>
            </div>
          ),
        )}
      </nav>
    </aside>
  )
}

function NavLabel({ expanded, children }: { expanded: boolean; children: string }) {
  return (
    <span
      className={cn(
        "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        expanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0",
      )}
    >
      {children}
    </span>
  )
}

function TelemetryGroup({
  item,
  expanded,
  onNavigate,
}: {
  item: NavItem
  expanded: boolean
  onNavigate?: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const childActive = item.children?.some((child) => location.pathname === child.to) ?? false
  const [open, setOpen] = useState(childActive && expanded)

  useEffect(() => {
    if (!expanded) setOpen(false)
    else if (childActive) setOpen(true)
  }, [expanded, childActive])

  return (
    <div>
      <button
        type="button"
        title={expanded ? undefined : item.label}
        aria-label={item.label}
        aria-expanded={expanded ? open : undefined}
        onClick={() => {
          if (!expanded) {
            navigate(item.children?.[0]?.to ?? "/machines")
            onNavigate?.()
            return
          }
          setOpen((value) => !value)
        }}
        className={cn(
          "flex w-full items-center rounded-lg py-2.5 text-[13px] font-medium transition-[background-color,color,padding,gap] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          expanded ? "gap-3 px-3" : "justify-center px-0",
          childActive ? "text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
          !expanded && childActive && "bg-[#3b6cff] text-white shadow-[0_6px_16px_rgba(59,108,255,0.35)]",
        )}
      >
        <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
        <NavLabel expanded={expanded}>{item.label}</NavLabel>
        <ChevronDownIcon
          className={cn(
            "size-3.5 shrink-0 opacity-70 transition-[transform,opacity,max-width] duration-300",
            expanded ? "max-w-4 opacity-70" : "max-w-0 opacity-0",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          open && expanded ? "mt-0.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-4 space-y-0.5 border-l border-white/10 pl-3">
            {item.children?.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-[#3b6cff] text-white"
                      : "text-white/65 hover:bg-white/8 hover:text-white",
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
