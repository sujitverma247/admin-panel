import type { ReactNode } from "react"
import { PageHeader } from "@/layout/PageHeader"

export function ListShell({
  title,
  description,
  error,
  empty,
  children,
}: {
  title: string
  description: string
  error: string | null
  empty: string | null
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <PageHeader title={title} description={description} />
      {error ? (
        <p className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e8edf5] bg-white p-5 shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
        {empty ? <p className="py-8 text-center text-sm text-[#8b93a7]">{empty}</p> : children}
      </div>
    </div>
  )
}
