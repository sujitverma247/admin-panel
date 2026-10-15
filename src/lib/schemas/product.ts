import { z } from "zod"
import type { ProductRow } from "@/lib/api/catalog"
import { isHttpUrl } from "@/lib/schemas/website"
import { isWebsiteSlug } from "@/lib/websiteSlug"
import { parseForm, type FieldErrors } from "@/lib/validation"

export const PRODUCT_NAME_MIN = 2
export const PRODUCT_NAME_MAX = 200
export const PRODUCT_SLUG_MIN = 2
export const PRODUCT_SLUG_MAX = 64
export const PRODUCT_APP_KEY_MIN = 2
export const PRODUCT_APP_KEY_MAX = 128
export const PRODUCT_KEY_PREFIX_MAX = 16
export const PRODUCT_UA_MIN = 2
export const PRODUCT_UA_MAX = 128
export const PRODUCT_VERSION_MAX = 64
export const PRODUCT_URL_MIN = 10
export const PRODUCT_URL_MAX = 512
export const PRODUCT_NOTES_MAX = 4000

export const PRODUCT_NAME_RANGE = `${PRODUCT_NAME_MIN}–${PRODUCT_NAME_MAX}`
export const PRODUCT_SLUG_RANGE = `${PRODUCT_SLUG_MIN}–${PRODUCT_SLUG_MAX}`

export type ProductDraft = {
  displayName: string
  slug: string
  brandId: string
  appKey: string
  keyPrefix: string
  userAgentPrefix: string
  latestVersion: string
  downloadUrl: string
  releaseNotes: string
  isActive: boolean
}

export type ProductField = keyof ProductDraft
export type ProductFieldErrors = FieldErrors<ProductField>

export function emptyProductDraft(): ProductDraft {
  return {
    displayName: "",
    slug: "",
    brandId: "",
    appKey: "",
    keyPrefix: "",
    userAgentPrefix: "",
    latestVersion: "",
    downloadUrl: "",
    releaseNotes: "",
    isActive: true,
  }
}

export function draftFromProduct(row: ProductRow): ProductDraft {
  return {
    displayName: row.displayName,
    slug: row.slug,
    brandId: row.brandId != null ? String(row.brandId) : "",
    appKey: row.appKey,
    keyPrefix: row.keyPrefix ?? "",
    userAgentPrefix: row.userAgentPrefix ?? "",
    latestVersion: row.latestVersion ?? "",
    downloadUrl: row.downloadUrl ?? "",
    releaseNotes: row.releaseNotes ?? "",
    isActive: row.isActive,
  }
}

const productFields = {
  displayName: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .min(PRODUCT_NAME_MIN, `Product name must be ${PRODUCT_NAME_RANGE} characters.`)
    .max(PRODUCT_NAME_MAX, `Product name must be ${PRODUCT_NAME_RANGE} characters.`),
  slug: z
    .string()
    .trim()
    .min(1, "Product slug is required.")
    .min(PRODUCT_SLUG_MIN, `Product slug must be ${PRODUCT_SLUG_RANGE} characters of a–z, 0–9, and hyphen.`)
    .max(PRODUCT_SLUG_MAX, `Product slug must be ${PRODUCT_SLUG_RANGE} characters of a–z, 0–9, and hyphen.`)
    .refine(isWebsiteSlug, `Product slug must be ${PRODUCT_SLUG_RANGE} characters of a–z, 0–9, and hyphen.`),
  brandId: z.string().min(1, "Website is required."),
  appKey: z
    .string()
    .trim()
    .min(1, "App key is required.")
    .min(PRODUCT_APP_KEY_MIN, `App key must be ${PRODUCT_APP_KEY_MIN}–${PRODUCT_APP_KEY_MAX} characters.`)
    .max(PRODUCT_APP_KEY_MAX, `App key must be ${PRODUCT_APP_KEY_MIN}–${PRODUCT_APP_KEY_MAX} characters.`),
  keyPrefix: z.string().trim().max(PRODUCT_KEY_PREFIX_MAX, `Key prefix must be at most ${PRODUCT_KEY_PREFIX_MAX} characters.`),
  userAgentPrefix: z
    .string()
    .trim()
    .min(1, "User agent prefix is required.")
    .min(PRODUCT_UA_MIN, `User agent prefix must be ${PRODUCT_UA_MIN}–${PRODUCT_UA_MAX} characters.`)
    .max(PRODUCT_UA_MAX, `User agent prefix must be ${PRODUCT_UA_MIN}–${PRODUCT_UA_MAX} characters.`),
  latestVersion: z.string().trim().max(PRODUCT_VERSION_MAX, `Version must be at most ${PRODUCT_VERSION_MAX} characters.`),
  downloadUrl: z
    .string()
    .trim()
    .max(PRODUCT_URL_MAX, `Download URL must be ${PRODUCT_URL_MIN}–${PRODUCT_URL_MAX} characters.`)
    .refine((value) => value === "" || value.length >= PRODUCT_URL_MIN, `Download URL must be ${PRODUCT_URL_MIN}–${PRODUCT_URL_MAX} characters.`)
    .refine((value) => value === "" || isHttpUrl(value), "Enter a valid download URL starting with http:// or https://."),
  releaseNotes: z.string().trim().max(PRODUCT_NOTES_MAX, `Release notes must be at most ${PRODUCT_NOTES_MAX} characters.`),
  isActive: z.boolean(),
}

export const createProductSchema = z.object(productFields)
export const editProductSchema = z.object({
  ...productFields,
  slug: z.string(),
})

export function productSchema(mode: "create" | "edit") {
  return mode === "create" ? createProductSchema : editProductSchema
}

export function validateProductDraft(draft: ProductDraft, mode: "create" | "edit"): ProductFieldErrors {
  return parseForm(productSchema(mode), draft).errors
}
