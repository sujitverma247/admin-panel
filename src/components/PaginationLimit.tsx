export const PAGE_SIZES = [10, 20, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

export function isPageSize(value: number): value is PageSize {
  return (PAGE_SIZES as readonly number[]).includes(value)
}

export function PaginationLimit({
  value,
  onChange,
  disabled,
}: {
  value: PageSize
  onChange: (limit: PageSize) => void
  disabled?: boolean
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[#8b93a7]">
      <span className="whitespace-nowrap">Per page</span>
      <select
        value={value}
        disabled={disabled}
        aria-label="Rows per page"
        onChange={(event) => onChange(Number(event.target.value) as PageSize)}
        className="h-8 rounded-lg border border-[#e8edf5] bg-white px-2 text-sm text-[#5b6478] outline-none disabled:opacity-50"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  )
}
