export function formatIso(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function maskKey(key: string) {
  if (key.length <= 4) return "****"
  return `****${key.slice(-4)}`
}
