import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const LOGO_TONES = [
  "bg-[#3b6cff] text-white",
  "bg-[#8b5cf6] text-white",
  "bg-[#ef4444] text-white",
  "bg-[#f59e0b] text-white",
  "bg-[#10b981] text-white",
  "bg-[#0ea5e9] text-white",
]

export function WebsiteLogo({
  name,
  logoUrl,
  seed = 0,
  className,
}: {
  name: string
  logoUrl?: string | null
  seed?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [logoUrl])
  const initial = name.trim().charAt(0).toUpperCase() || "W"
  const showImage = Boolean(logoUrl) && !failed

  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold",
        showImage ? "bg-[#eef2f7]" : LOGO_TONES[Math.abs(seed) % LOGO_TONES.length],
        className,
      )}
    >
      {showImage ? (
        <img
          key={logoUrl}
          src={logoUrl ?? ""}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </span>
  )
}
