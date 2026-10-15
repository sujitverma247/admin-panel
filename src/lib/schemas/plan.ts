import { z } from "zod"
import type { PlanRow } from "@/lib/api/catalog"
import { parseForm, type FieldErrors } from "@/lib/validation"
import { toWebsiteSlug } from "@/lib/websiteSlug"

export const PLAN_NAME_MIN = 2
export const PLAN_NAME_MAX = 200
export const PLAN_CODE_MIN = 2
export const PLAN_CODE_MAX = 32
export const PLAN_DURATION_MIN = 1
export const PLAN_DURATION_MAX = 36500
export const PLAN_MACHINES_MIN = 1
export const PLAN_MACHINES_MAX = 100
export const PLAN_EXTERNAL_ID_MAX = 128

export const PLAN_NAME_RANGE = `${PLAN_NAME_MIN}–${PLAN_NAME_MAX}`
export const PLAN_CODE_RANGE = `${PLAN_CODE_MIN}–${PLAN_CODE_MAX}`

export const PLAN_GATEWAYS = ["freemius", "dev", "manual"] as const

const PLAN_CODE = /^[a-z0-9-]{2,32}$/

export function toPlanCode(name: string) {
  return toWebsiteSlug(name).slice(0, PLAN_CODE_MAX)
}

export function isPlanCode(value: string) {
  return PLAN_CODE.test(value)
}

export type PlanDraft = {
  productId: string
  displayName: string
  code: string
  durationDays: string
  defaultMaxMachines: string
  gateway: string
  externalPlanId: string
  isActive: boolean
}

export type PlanField = keyof PlanDraft
export type PlanFieldErrors = FieldErrors<PlanField>

export function emptyPlanDraft(): PlanDraft {
  return {
    productId: "",
    displayName: "",
    code: "",
    durationDays: "365",
    defaultMaxMachines: "3",
    gateway: "freemius",
    externalPlanId: "",
    isActive: true,
  }
}

export function draftFromPlan(row: PlanRow): PlanDraft {
  return {
    productId: row.productId != null ? String(row.productId) : "",
    displayName: row.displayName,
    code: row.planCode || row.code,
    durationDays: String(row.durationDays || 365),
    defaultMaxMachines: String(row.defaultMaxMachines || 3),
    gateway: (row.gateway || "freemius").toLowerCase(),
    externalPlanId: row.externalPlanId ?? "",
    isActive: row.isActive,
  }
}

function parseAmount(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((raw) => Number.isFinite(Number(raw)), `Enter a valid ${label.toLowerCase()}.`)
    .refine((raw) => Number(raw) >= min && Number(raw) <= max, `${label} must be ${min}–${max}.`)
}

const planFields = {
  productId: z.string().min(1, "Product is required."),
  displayName: z
    .string()
    .trim()
    .min(1, "Plan name is required.")
    .min(PLAN_NAME_MIN, `Plan name must be ${PLAN_NAME_RANGE} characters.`)
    .max(PLAN_NAME_MAX, `Plan name must be ${PLAN_NAME_RANGE} characters.`),
  code: z
    .string()
    .trim()
    .min(1, "Plan code is required.")
    .min(PLAN_CODE_MIN, `Plan code must be ${PLAN_CODE_RANGE} characters of a–z, 0–9, and hyphen.`)
    .max(PLAN_CODE_MAX, `Plan code must be ${PLAN_CODE_RANGE} characters of a–z, 0–9, and hyphen.`)
    .refine(isPlanCode, `Plan code must be ${PLAN_CODE_RANGE} characters of a–z, 0–9, and hyphen.`),
  durationDays: parseAmount("Duration", PLAN_DURATION_MIN, PLAN_DURATION_MAX).refine(
    (raw) => Number.isInteger(Number(raw)),
    "Duration must be a whole number of days.",
  ),
  defaultMaxMachines: parseAmount("Max machines", PLAN_MACHINES_MIN, PLAN_MACHINES_MAX).refine(
    (raw) => Number.isInteger(Number(raw)),
    "Max machines must be a whole number.",
  ),
  gateway: z.string().trim().min(1, "Payment gateway is required."),
  externalPlanId: z
    .string()
    .trim()
    .min(1, "Gateway plan ID is required.")
    .max(PLAN_EXTERNAL_ID_MAX, `Gateway plan ID must be at most ${PLAN_EXTERNAL_ID_MAX} characters.`),
  isActive: z.boolean(),
}

export const createPlanSchema = z.object(planFields)
export const editPlanSchema = z.object({
  ...planFields,
  code: z.string(),
})

export function planSchema(mode: "create" | "edit") {
  return mode === "create" ? createPlanSchema : editPlanSchema
}

export function validatePlanDraft(draft: PlanDraft, mode: "create" | "edit"): PlanFieldErrors {
  return parseForm(planSchema(mode), draft).errors
}
