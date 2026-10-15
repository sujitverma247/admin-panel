import type { ReactNode } from "react"
import { ListPageFrame, TableScroll } from "@/components/TableScroll"
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
    <ListPageFrame>
      <div className="shrink-0">
        <PageHeader title={title} description={description} />
      </div>
      {error ? (
        <p className="mb-4 shrink-0 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</p>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_1px_2px_rgba(16,42,96,0.04)]">
        {empty ? (
          <p className="py-8 text-center text-sm text-[#8b93a7]">{empty}</p>
        ) : (
          <TableScroll className="p-5">{children}</TableScroll>
        )}
      </div>
    </ListPageFrame>
  )
}
