import { z } from "zod"
import type { BrandRow } from "@/lib/api/catalog"
import { isWebsiteSlug } from "@/lib/websiteSlug"
import { parseForm, type FieldErrors } from "@/lib/validation"

export const WEBSITE_NAME_MIN = 2
export const WEBSITE_NAME_MAX = 200
export const WEBSITE_SLUG_MIN = 2
export const WEBSITE_SLUG_MAX = 64
export const WEBSITE_URL_MIN = 10
export const WEBSITE_URL_MAX = 512
export const WEBSITE_EMAIL_MIN = 6
export const WEBSITE_EMAIL_MAX = 256

export const WEBSITE_NAME_RANGE = `${WEBSITE_NAME_MIN}–${WEBSITE_NAME_MAX}`
export const WEBSITE_SLUG_RANGE = `${WEBSITE_SLUG_MIN}–${WEBSITE_SLUG_MAX}`
export const WEBSITE_URL_RANGE = `${WEBSITE_URL_MIN}–${WEBSITE_URL_MAX}`
export const WEBSITE_EMAIL_RANGE = `${WEBSITE_EMAIL_MIN}–${WEBSITE_EMAIL_MAX}`

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export type WebsiteDraft = {
  name: string
  slug: string
  websiteUrl: string
  logoUrl: string
  supportEmail: string
  isActive: boolean
}

export type WebsiteField = keyof WebsiteDraft
export type WebsiteFieldErrors = FieldErrors<WebsiteField>

export function emptyWebsiteDraft(): WebsiteDraft {
  return { name: "", slug: "", websiteUrl: "", logoUrl: "", supportEmail: "", isActive: true }
}

export function draftFromWebsite(row: BrandRow): WebsiteDraft {
  return {
    name: row.name,
    slug: row.slug,
    websiteUrl: row.websiteUrl ?? "",
    logoUrl: row.logoUrl ?? "",
    supportEmail: row.supportEmail ?? "",
    isActive: row.isActive,
  }
}

function optionalLength(min: number, max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .refine((value) => value === "" || value.length >= min, message)
}

function optionalHttpUrl(rangeMessage: string, formatMessage: string) {
  return optionalLength(WEBSITE_URL_MIN, WEBSITE_URL_MAX, rangeMessage).refine(
    (value) => value === "" || isHttpUrl(value),
    formatMessage,
  )
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname)
  } catch {
    return false
  }
}

const websiteFields = {
  name: z
    .string()
    .trim()
    .min(1, "Website name is required.")
    .min(WEBSITE_NAME_MIN, `Website name must be ${WEBSITE_NAME_RANGE} characters.`)
    .max(WEBSITE_NAME_MAX, `Website name must be ${WEBSITE_NAME_RANGE} characters.`),
  slug: z
    .string()
    .trim()
    .min(1, "Website slug is required.")
    .min(WEBSITE_SLUG_MIN, `Website slug must be ${WEBSITE_SLUG_RANGE} characters of a–z, 0–9, and hyphen.`)
    .max(WEBSITE_SLUG_MAX, `Website slug must be ${WEBSITE_SLUG_RANGE} characters of a–z, 0–9, and hyphen.`)
    .refine(isWebsiteSlug, `Website slug must be ${WEBSITE_SLUG_RANGE} characters of a–z, 0–9, and hyphen.`),
  websiteUrl: optionalHttpUrl(
    `Website URL must be ${WEBSITE_URL_RANGE} characters.`,
    "Enter a valid website URL starting with http:// or https://.",
  ),
  logoUrl: optionalHttpUrl(
    `Logo URL must be ${WEBSITE_URL_RANGE} characters.`,
    "Enter a valid logo URL starting with http:// or https://.",
  ),
  supportEmail: optionalLength(
    WEBSITE_EMAIL_MIN,
    WEBSITE_EMAIL_MAX,
    `Support email must be ${WEBSITE_EMAIL_RANGE} characters.`,
  ).refine((value) => value === "" || EMAIL_PATTERN.test(value.toLowerCase()), "Enter a valid support email."),
  isActive: z.boolean(),
}

export const createWebsiteSchema = z.object(websiteFields)
export const editWebsiteSchema = z.object({
  ...websiteFields,
  slug: z.string(),
})

export function websiteSchema(mode: "create" | "edit") {
  return mode === "create" ? createWebsiteSchema : editWebsiteSchema
}

export function validateWebsiteDraft(draft: WebsiteDraft, mode: "create" | "edit"): WebsiteFieldErrors {
  return parseForm(websiteSchema(mode), draft).errors
}
