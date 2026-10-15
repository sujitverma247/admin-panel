import { z } from "zod"
import type { KeyRow } from "@/lib/api/keys"
import { parseForm, type FieldErrors } from "@/lib/validation"

export const KEY_NAME_MAX = 200
export const KEY_NOTES_MAX = 1024
export const KEY_MACHINES_MIN = 1
export const KEY_MACHINES_MAX = 100

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const maxMachinesSchema = z
  .string()
  .trim()
  .min(1, "Max devices is required.")
  .refine((raw) => Number.isInteger(Number(raw)), "Max devices must be a whole number.")
  .refine((raw) => {
    const n = Number(raw)
    return n >= KEY_MACHINES_MIN && n <= KEY_MACHINES_MAX
  }, `Max devices must be ${KEY_MACHINES_MIN}–${KEY_MACHINES_MAX}.`)

export type IssueKeyDraft = {
  productId: string
  customerEmail: string
  name: string
  planType: string
  maxMachines: string
  notes: string
  locale: string
}

export type IssueKeyField = keyof IssueKeyDraft
export type IssueKeyFieldErrors = FieldErrors<IssueKeyField>

export function emptyIssueKeyDraft(): IssueKeyDraft {
  return {
    productId: "",
    customerEmail: "",
    name: "",
    planType: "1year",
    maxMachines: "3",
    notes: "",
    locale: "en",
  }
}

const issueKeySchema = z.object({
  productId: z.string().trim().min(1, "Product is required."),
  customerEmail: z
    .string()
    .trim()
    .min(1, "Customer email is required.")
    .max(256, "Customer email must be at most 256 characters.")
    .refine((value) => EMAIL_PATTERN.test(value), "Enter a valid customer email."),
  name: z.string().trim().max(KEY_NAME_MAX, `Customer name must be at most ${KEY_NAME_MAX} characters.`),
  planType: z.string().trim().min(1, "Plan is required."),
  maxMachines: maxMachinesSchema,
  notes: z.string().trim().max(KEY_NOTES_MAX, `Notes must be at most ${KEY_NOTES_MAX} characters.`),
  locale: z.enum(["en", "de"], { message: "Language is required." }),
})

export function validateIssueKeyDraft(draft: IssueKeyDraft): IssueKeyFieldErrors {
  return parseForm(issueKeySchema, draft).errors
}

export type EditKeyDraft = {
  customerEmail: string
  planType: string
  maxMachines: string
  notes: string
}

export type EditKeyField = keyof EditKeyDraft
export type EditKeyFieldErrors = FieldErrors<EditKeyField>

export function draftFromKey(row: KeyRow): EditKeyDraft {
  return {
    customerEmail: row.customerEmail ?? "",
    planType: row.planType,
    maxMachines: String(row.maxMachines),
    notes: row.notes ?? "",
  }
}

const editKeySchema = z.object({
  customerEmail: z
    .string()
    .trim()
    .max(256, "Customer email must be at most 256 characters.")
    .refine((value) => value.length === 0 || EMAIL_PATTERN.test(value), "Enter a valid customer email."),
  planType: z.string().trim().min(1, "Plan is required."),
  maxMachines: maxMachinesSchema,
  notes: z.string().trim().max(KEY_NOTES_MAX, `Notes must be at most ${KEY_NOTES_MAX} characters.`),
})

export function validateEditKeyDraft(draft: EditKeyDraft): EditKeyFieldErrors {
  return parseForm(editKeySchema, draft).errors
}
