import { z } from "zod"
import type { AdminUserRow } from "@/lib/api/users"
import { parseForm, type FieldErrors } from "@/lib/validation"

export const USER_USERNAME_MIN = 2
export const USER_USERNAME_MAX = 128
export const USER_NAME_MAX = 200
export const USER_PASSWORD_MIN = 8
export const USER_PASSWORD_MAX = 128

export const USER_USERNAME_RANGE = `${USER_USERNAME_MIN}–${USER_USERNAME_MAX}`
export const USER_PASSWORD_RANGE = `${USER_PASSWORD_MIN}–${USER_PASSWORD_MAX}`

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/

export type UserDraft = {
  username: string
  displayName: string
  role: string
  password: string
  isActive: boolean
}

export type UserField = keyof UserDraft
export type UserFieldErrors = FieldErrors<UserField>

export function emptyUserDraft(role = "agent"): UserDraft {
  return { username: "", displayName: "", role, password: "", isActive: true }
}

export function draftFromUser(row: AdminUserRow): UserDraft {
  return {
    username: row.username,
    displayName: row.displayName ?? "",
    role: row.role,
    password: "",
    isActive: row.isActive,
  }
}

export function validateUserDraft(draft: UserDraft, mode: "create" | "edit" = "create"): UserFieldErrors {
  const schema = z.object({
    username: z
      .string()
      .trim()
      .min(1, "Username is required.")
      .min(USER_USERNAME_MIN, `Username must be at least ${USER_USERNAME_MIN} characters.`)
      .max(USER_USERNAME_MAX, `Username must be at most ${USER_USERNAME_MAX} characters.`)
      .refine((value) => USERNAME_PATTERN.test(value), "Use letters, numbers, dots, hyphens, and underscores."),
    displayName: z.string().trim().max(USER_NAME_MAX, `Name must be at most ${USER_NAME_MAX} characters.`),
    role: z.string().trim().min(1, "Role is required."),
    password:
      mode === "create"
        ? z
            .string()
            .min(1, "Password is required.")
            .min(USER_PASSWORD_MIN, `Password must be at least ${USER_PASSWORD_MIN} characters.`)
            .max(USER_PASSWORD_MAX, `Password must be at most ${USER_PASSWORD_MAX} characters.`)
        : z
            .string()
            .refine(
              (value) => value.length === 0 || value.length >= USER_PASSWORD_MIN,
              `Password must be at least ${USER_PASSWORD_MIN} characters.`,
            )
            .refine(
              (value) => value.length <= USER_PASSWORD_MAX,
              `Password must be at most ${USER_PASSWORD_MAX} characters.`,
            ),
    isActive: z.boolean(),
  })
  return parseForm(schema, draft).errors
}
