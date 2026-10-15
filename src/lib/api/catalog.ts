import { api, ApiError, NetworkError } from "@/lib/api/client"

export type BrandRow = {
  id: number
  slug: string
  name: string
  supportEmail: string
  websiteUrl: string
  logoUrl: string
  isActive: boolean
  productCount?: number
  createdAt: string
}

export type BrandListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | "active" | "inactive"
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type BrandListResponse = {
  brands: BrandRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; active: number; inactive: number }
}

const ALLOWED_LIMITS = new Set([10, 20, 50, 100])

export function brandsQuery(params: BrandListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/brands?${search.toString()}`
}

export type ProductRow = {
  id: number
  brandId: number | null
  brandName?: string
  brandLogoUrl?: string
  slug: string
  displayName: string
  appKey: string
  keyPrefix: string
  userAgentPrefix: string
  hasHmacSecret: boolean
  latestVersion: string
  downloadUrl: string
  releaseNotes: string
  isActive: boolean
  licenseCount?: number
  createdAt: string
}

export type ProductListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | "active" | "inactive"
  brandId?: number
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type ProductListResponse = {
  products: ProductRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; active: number; inactive: number }
}

export type ProductWrite = {
  displayName: string
  slug?: string
  brandId?: number | null
  appKey?: string
  keyPrefix?: string
  userAgentPrefix?: string
  latestVersion?: string
  downloadUrl?: string
  releaseNotes?: string
  isActive?: boolean
}

export function productsQuery(params: ProductListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.brandId && params.brandId > 0) search.set("brandId", String(params.brandId))
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/products?${search.toString()}`
}

export type BrandWrite = {
  name: string
  slug?: string
  supportEmail?: string
  websiteUrl?: string
  logoUrl?: string
  isActive?: boolean
}

export function listBrands(token: string, params: BrandListQuery = {}, signal?: AbortSignal) {
  return api<BrandListResponse>(brandsQuery(params), { token, signal })
}

export function createBrand(token: string, body: Required<Pick<BrandWrite, "name" | "slug">> & BrandWrite) {
  return api<{ brand: BrandRow }>("/admin/brands", { method: "POST", token, body })
}

export function updateBrand(token: string, id: number, body: BrandWrite) {
  return api<{ brand: BrandRow }>(`/admin/brands/${id}`, { method: "PUT", token, body })
}

export function deleteBrand(token: string, id: number) {
  return api<{ ok: boolean; id: number }>(`/admin/brands/${id}`, { method: "DELETE", token })
}

export function listProducts(token: string, params: ProductListQuery = {}, signal?: AbortSignal) {
  return api<ProductListResponse>(productsQuery(params), { token, signal })
}

export function createProduct(token: string, body: Required<Pick<ProductWrite, "displayName" | "slug" | "brandId" | "appKey" | "userAgentPrefix">> & ProductWrite) {
  return api<{ product: ProductRow }>("/admin/products", { method: "POST", token, body })
}

export function updateProduct(token: string, id: number, body: ProductWrite) {
  return api<{ product: ProductRow }>(`/admin/products/${id}`, { method: "PUT", token, body })
}

export function deleteProduct(token: string, id: number) {
  return api<{ ok: boolean; id: number }>(`/admin/products/${id}`, { method: "DELETE", token })
}

export type PlanRow = {
  id: number
  productId: number
  productName?: string
  productSlug?: string
  gateway: string
  planCode: string
  code: string
  displayName: string
  durationDays: number
  defaultMaxMachines: number
  externalPlanId: string
  isActive: boolean
  licenseCount?: number
  createdAt: string
}

export type PlanListQuery = {
  page?: number
  limit?: number
  q?: string
  status?: "all" | "active" | "inactive"
  productId?: number
  gateway?: string
  from?: string
  to?: string
  sort?: string
  dir?: "asc" | "desc"
}

export type PlanListResponse = {
  plans: PlanRow[]
  total: number
  page: number
  limit: number
  counts: { total: number; active: number; inactive: number }
  gateways: string[]
}

export type PlanWrite = {
  displayName: string
  code?: string
  planCode?: string
  productId?: number
  gateway?: string
  externalPlanId?: string
  durationDays?: number
  defaultMaxMachines?: number
  isActive?: boolean
}

export function plansQuery(params: PlanListQuery = {}) {
  const search = new URLSearchParams()
  search.set("page", String(params.page && params.page > 0 ? params.page : 1))
  search.set("limit", String(params.limit && ALLOWED_LIMITS.has(params.limit) ? params.limit : 10))
  const q = params.q?.trim()
  if (q) search.set("q", q)
  if (params.status && params.status !== "all") search.set("status", params.status)
  if (params.productId && params.productId > 0) search.set("productId", String(params.productId))
  if (params.gateway) search.set("gateway", params.gateway)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.sort) search.set("sort", params.sort)
  if (params.dir) search.set("dir", params.dir)
  return `/admin/gateway-plans?${search.toString()}`
}

export function listPlans(token: string, params: PlanListQuery = {}, signal?: AbortSignal) {
  return api<PlanListResponse>(plansQuery(params), { token, signal })
}

export function createPlan(
  token: string,
  body: Required<Pick<PlanWrite, "displayName" | "code" | "productId" | "gateway" | "externalPlanId" | "durationDays">> & PlanWrite,
) {
  return api<{ plan: PlanRow }>("/admin/gateway-plans", {
    method: "POST",
    token,
    body: { ...body, planCode: body.code },
  })
}

export function updatePlan(token: string, id: number, body: PlanWrite) {
  return api<{ plan: PlanRow }>(`/admin/gateway-plans/${id}`, {
    method: "PUT",
    token,
    body: { ...body, planCode: body.code ?? body.planCode },
  })
}

export function deletePlan(token: string, id: number) {
  return api<{ ok: boolean; id: number }>(`/admin/gateway-plans/${id}`, { method: "DELETE", token })
}

export function toWebsiteError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to change websites."
    if (err.message === "missing name") return "Website name is required."
    if (err.message === "name too short" || err.message === "name too long")
      return "Website name must be 2–200 characters."
    if (err.message.startsWith("slug must")) return "Website slug must be 2–64 characters of a–z, 0–9, and hyphen."
    if (err.message === "slug already exists") return "A website with this slug already exists."
    if (err.message === "supportEmail too short" || err.message === "supportEmail too long")
      return "Support email must be 6–256 characters."
    if (err.message === "invalid supportEmail") return "Enter a valid support email."
    if (err.message === "websiteUrl too short" || err.message === "websiteUrl too long")
      return "Website URL must be 10–512 characters."
    if (err.message.startsWith("websiteUrl")) return "Enter a valid website URL starting with http:// or https://."
    if (err.message === "logoUrl too short" || err.message === "logoUrl too long")
      return "Logo URL must be 10–512 characters."
    if (err.message.startsWith("logoUrl")) return "Enter a valid logo URL starting with http:// or https://."
    if (err.message === "brand not found") return "Website not found."
    if (err.status === 409) return "A website with this slug already exists."
    if (err.status === 404) return "Website not found."
  }
  return "Unable to save website."
}

export function toProductError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to change products."
    if (err.message === "missing displayName") return "Product name is required."
    if (err.message === "displayName too short" || err.message === "displayName too long")
      return "Product name must be 2–200 characters."
    if (err.message.startsWith("slug must")) return "Product slug must be 2–64 characters of a–z, 0–9, and hyphen."
    if (err.message === "slug already exists") return "A product with this slug already exists."
    if (err.message === "missing appKey" || err.message === "appKey too long") return "Enter a valid app key (at most 128 characters)."
    if (err.message === "appKey already exists") return "A product with this app key already exists."
    if (err.message === "missing userAgentPrefix") return "User agent prefix is required."
    if (err.message === "missing hmacSecret") return "HMAC secret is required."
    if (err.message === "missing brandId") return "Website is required."
    if (err.message === "unknown brandId") return "Selected website was not found."
    if (err.message === "product not found") return "Product not found."
    if (err.status === 409) return err.message.includes("licenses") || err.message.includes("batches")
      ? "This product still has licenses or key batches, so it cannot be deleted."
      : "A product with this slug or app key already exists."
    if (err.status === 404) return "Product not found."
  }
  return "Unable to save product."
}

export function toProductDeleteError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to delete products."
    if (err.status === 409) return "This product still has licenses or key batches, so it cannot be deleted."
    if (err.status === 404 || err.message === "product not found") return "Product not found."
  }
  return "Unable to delete product."
}

export function toWebsiteDeleteError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to delete websites."
    if (err.status === 404 || err.message === "brand not found") return "Website not found."
  }
  return "Unable to delete website."
}

export function toPlanError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to change plans."
    if (err.message === "missing displayName") return "Plan name is required."
    if (err.message === "displayName too short" || err.message === "displayName too long")
      return "Plan name must be 2–200 characters."
    if (err.message.startsWith("code must")) return "Plan code must be 2–32 characters of a–z, 0–9, and hyphen."
    if (err.message === "code already exists" || err.message === "mapping already exists")
      return "This product already has that plan mapped for this gateway."
    if (err.message === "missing productId" || err.message === "unknown productId") return "Product is required."
    if (err.message === "missing gateway") return "Payment gateway is required."
    if (err.message === "missing externalPlanId") return "Gateway plan ID is required."
    if (err.message.startsWith("durationDays")) return "Duration must be between 1 and 36500 days."
    if (err.message === "plan not found") return "Plan not found."
    if (err.status === 409)
      return err.message.includes("licenses") || err.message.includes("batches") || err.message.includes("orders") || err.message.includes("gateway")
        ? "This plan is still used by licenses, orders, or key batches, so it cannot be deleted."
        : "A plan with this code already exists."
    if (err.status === 404) return "Plan not found."
  }
  return "Unable to save plan."
}

export function toPlanDeleteError(err: unknown) {
  if (err instanceof NetworkError) return err.message
  if (err instanceof ApiError) {
    if (err.status === 403) return "You do not have permission to delete plans."
    if (err.status === 409) return "This plan is still used by licenses, orders, or key batches, so it cannot be deleted."
    if (err.status === 404 || err.message === "plan not found") return "Plan not found."
  }
  return "Unable to delete plan."
}
