import { z } from "zod"
import type { CustomerRow } from "@/lib/api/customers"
import { parseForm, type FieldErrors } from "@/lib/validation"

export const CUSTOMER_EMAIL_MAX = 256
export const CUSTOMER_NAME_MAX = 200
export const CUSTOMER_PHONE_MAX = 32
export const CUSTOMER_NOTES_MAX = 1024

export const CUSTOMER_EMAIL_RANGE = `6–${CUSTOMER_EMAIL_MAX}`
export const CUSTOMER_NAME_RANGE = `at most ${CUSTOMER_NAME_MAX}`
export const CUSTOMER_NOTES_RANGE = `at most ${CUSTOMER_NOTES_MAX}`

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export type CustomerDraft = {
  email: string
  displayName: string
  phone: string
  notes: string
  isActive: boolean
}

export type CustomerField = keyof CustomerDraft
export type CustomerFieldErrors = FieldErrors<CustomerField>

export function emptyCustomerDraft(): CustomerDraft {
  return { email: "", displayName: "", phone: "", notes: "", isActive: true }
}

export function draftFromCustomer(row: CustomerRow): CustomerDraft {
  return {
    email: row.email,
    displayName: row.displayName ?? "",
    phone: row.phone ?? "",
    notes: row.notes ?? "",
    isActive: row.isActive,
  }
}

const customerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(CUSTOMER_EMAIL_MAX, `Email must be at most ${CUSTOMER_EMAIL_MAX} characters.`)
    .refine((value) => EMAIL_PATTERN.test(value), "Enter a valid customer email."),
  displayName: z.string().trim().max(CUSTOMER_NAME_MAX, `Name must be at most ${CUSTOMER_NAME_MAX} characters.`),
  phone: z.string().trim().max(CUSTOMER_PHONE_MAX, `Phone must be at most ${CUSTOMER_PHONE_MAX} characters.`),
  notes: z.string().trim().max(CUSTOMER_NOTES_MAX, `Notes must be at most ${CUSTOMER_NOTES_MAX} characters.`),
  isActive: z.boolean(),
})

export function validateCustomerDraft(draft: CustomerDraft): CustomerFieldErrors {
  return parseForm(customerSchema, draft).errors
}
