export function formatIso(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function maskKey(key: string) {
  if (key.length <= 4) return "****"
  return `****${key.slice(-4)}`
}

export function formatCount(value: number) {
  return new Intl.NumberFormat().format(value)
}

export function formatMoney(amount: number, currency: string) {
  const code = currency.trim().toUpperCase()
  if (code.length === 3) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(amount)
    } catch {
      /* fall through */
    }
  }
  return `${code} ${amount.toFixed(2)}`.trim()
}

export function formatSignedPct(value: number) {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value}%`
}

export function formatSignedInt(value: number) {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value}`
}

export function formatDayLabel(isoDate: string) {
  if (/^\d{4}-\d{2}$/.test(isoDate)) {
    const month = new Date(`${isoDate}-01T00:00:00Z`)
    if (Number.isNaN(month.getTime())) return isoDate
    return month.toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" })
  }
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })
}

export function formatRange(fromIso: string, toIso: string) {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return ""
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }
  return `${from.toLocaleDateString(undefined, opts)} – ${to.toLocaleDateString(undefined, opts)}`
}

export function titleStatus(status: string) {
  if (!status) return status
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}
