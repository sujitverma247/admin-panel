import { useEffect, useId, useRef, useState } from "react"
import { useNavigate } from "react-router"
import {
  HeadphonesIcon,
  KeyRoundIcon,
  SearchIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { Input } from "@/components/ui/input"
import { globalSearch, searchKindLabel, type SearchHit, type SearchKind } from "@/lib/api/search"
import { cn } from "@/lib/utils"

const ICONS: Record<SearchKind, typeof UsersIcon> = {
  customer: UsersIcon,
  order: ShoppingCartIcon,
  key: KeyRoundIcon,
  ticket: HeadphonesIcon,
}

export function SearchBar({ className }: { className?: string }) {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const boxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [active, setActive] = useState(0)
  const trimmed = query.trim()

  useEffect(() => {
    if (!token || trimmed.length < 2) {
      setHits([])
      setLoading(false)
      return
    }
    const ac = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      globalSearch(token, trimmed, user?.permissions, ac.signal)
        .then((rows) => {
          if (ac.signal.aborted) return
          setHits(rows)
          setActive(0)
        })
        .catch(() => {
          if (ac.signal.aborted) return
          setHits([])
        })
        .finally(() => {
          if (!ac.signal.aborted) setLoading(false)
        })
    }, 220)
    return () => {
      window.clearTimeout(timer)
      ac.abort()
    }
  }, [token, trimmed, user?.permissions])

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  function go(hit: SearchHit) {
    setOpen(false)
    navigate(hit.to)
  }

  const showPanel = open && trimmed.length >= 2
  const grouped = groupHits(hits)

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-[540px]", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-[#9aa3b5]" />
      <Input
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={boxId}
        aria-autocomplete="list"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showPanel) return
          if (e.key === "Escape") {
            setOpen(false)
            return
          }
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setActive((n) => Math.min(hits.length - 1, n + 1))
          }
          if (e.key === "ArrowUp") {
            e.preventDefault()
            setActive((n) => Math.max(0, n - 1))
          }
          if (e.key === "Enter" && hits[active]) {
            e.preventDefault()
            go(hits[active])
          }
        }}
        placeholder="Search by order, customer, key, ticket..."
        className="h-10 rounded-full border-[#e4e8f0] bg-[#f4f6fb] pr-4 pl-10 text-sm text-[#1b2a4a] shadow-none placeholder:text-[#b0b7c6] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20"
      />

      {showPanel ? (
        <div
          id={boxId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-[28rem] w-full overflow-y-auto rounded-2xl border border-[#e8edf5] bg-white py-2 shadow-[0_12px_40px_rgba(15,31,61,0.12)]"
        >
          {loading && hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#8b93a7]">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[#8b93a7]">No matches for “{trimmed}”</p>
          ) : (
            grouped.map((group) => (
              <div key={group.kind} className="px-2 py-1">
                <p className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-[#8b93a7] uppercase">
                  {searchKindLabel(group.kind)}
                </p>
                {group.hits.map((hit) => {
                  const Icon = ICONS[hit.kind]
                  const index = hits.findIndex((row) => row.kind === hit.kind && row.id === hit.id)
                  return (
                    <button
                      key={`${hit.kind}-${hit.id}`}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(hit)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left",
                        index === active ? "bg-[#f4f7ff]" : "hover:bg-[#f8fafc]",
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7] text-[#5b6478]">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[#0f1f3d]">{hit.title}</span>
                        {hit.subtitle ? (
                          <span className="mt-0.5 block truncate text-xs text-[#8b93a7]">{hit.subtitle}</span>
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

function groupHits(hits: SearchHit[]) {
  const order: SearchKind[] = ["customer", "order", "key", "ticket"]
  return order
    .map((kind) => ({ kind, hits: hits.filter((hit) => hit.kind === kind) }))
    .filter((group) => group.hits.length > 0)
}
