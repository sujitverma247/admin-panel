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

export function formatChartTick(isoDate: string, opts?: { emphasizeYear?: boolean }) {
  if (/^\d{4}-\d{2}$/.test(isoDate)) {
    const month = new Date(`${isoDate}-01T00:00:00Z`)
    if (Number.isNaN(month.getTime())) return isoDate
    return month.toLocaleDateString(undefined, {
      month: "short",
      ...(opts?.emphasizeYear ? { year: "2-digit" as const } : {}),
      timeZone: "UTC",
    })
  }
  return formatDayLabel(isoDate)
}

export type ChartBucketKind = "day" | "week" | "month"

export function chartBucketKind(labels: string[]): ChartBucketKind {
  if (labels.length === 0) return "day"
  if (labels.every((label) => /^\d{4}-\d{2}$/.test(label))) return "month"
  if (labels.length >= 2) {
    const first = Date.parse(`${labels[0]}T00:00:00Z`)
    const second = Date.parse(`${labels[1]}T00:00:00Z`)
    if (Number.isFinite(first) && Number.isFinite(second) && second - first >= 6 * 86_400_000) return "week"
  }
  return "day"
}

export function formatChartPointLabel(isoDate: string, kind: ChartBucketKind = "day") {
  if (kind === "month" || /^\d{4}-\d{2}$/.test(isoDate)) {
    const month = new Date(`${isoDate.length === 7 ? isoDate : isoDate.slice(0, 7)}-01T00:00:00Z`)
    if (Number.isNaN(month.getTime())) return isoDate
    return month.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })
  }
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  const formatted = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
  return kind === "week" ? `Week of ${formatted}` : formatted
}

export function formatChartMetric(count: number, singular: string) {
  const noun = count === 1 ? singular : `${singular}s`
  return `${formatCount(count)} ${noun}`
}

/** Keep at most `maxTicks` axis labels so month/year charts do not overlap. */
export function sparseChartLabels(labels: string[], maxTicks = 7): (string | null)[] {
  if (labels.length === 0) return []
  const monthly = labels.every((label) => /^\d{4}-\d{2}$/.test(label))
  const limit = monthly ? 12 : maxTicks
  const last = labels.length - 1
  const show = Array.from({ length: labels.length }, () => labels.length <= limit)
  if (labels.length > limit) {
    const slots = Math.max(1, maxTicks - 1)
    for (let i = 0; i < maxTicks; i++) {
      show[Math.round((i * last) / slots)] = true
    }
  }
  return labels.map((label, index) => {
    if (!show[index]) return null
    return formatChartTick(label, { emphasizeYear: monthly && (index === 0 || index === last) })
  })
}

export function formatRange(fromIso: string, toIso: string) {
  const from = new Date(`${fromIso}T00:00:00Z`)
  const to = new Date(`${toIso}T00:00:00Z`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return ""
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }
  return `${from.toLocaleDateString(undefined, opts)} – ${to.toLocaleDateString(undefined, opts)}`
}

export function titleStatus(status: string) {
  if (!status) return status
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}
