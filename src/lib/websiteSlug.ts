const SLUG = /^[a-z0-9-]{2,64}$/

export function toWebsiteSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

export function isWebsiteSlug(value: string) {
  return SLUG.test(value)
}
