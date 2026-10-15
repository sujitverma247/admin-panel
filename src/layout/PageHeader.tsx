import type { ReactNode } from "react"

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-4 flex min-w-0 items-start justify-between gap-4">
      <div>
        <h1 className="text-[1.7rem] leading-none font-semibold tracking-tight text-[#0f1f3d]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-[#8b93a7]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
