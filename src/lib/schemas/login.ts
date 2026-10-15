import { z } from "zod"

export const USERNAME_MIN = 3
export const USERNAME_MAX = 64
export const EMAIL_MAX = 256
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

/** Same shape as master-server EmailAddress: local@domain.tld, max 256. */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/

export const identitySchema = z
  .string()
  .trim()
  .min(1, "Enter your username or email.")
  .superRefine((value, ctx) => {
    if (value.includes("@")) {
      if (value.length > EMAIL_MAX) {
        ctx.addIssue({ code: "custom", message: `Email must be at most ${EMAIL_MAX} characters.` })
        return
      }
      if (!EMAIL_PATTERN.test(value.toLowerCase())) {
        ctx.addIssue({ code: "custom", message: "Enter a valid email address." })
      }
      return
    }

    if (value.length < USERNAME_MIN) {
      ctx.addIssue({ code: "custom", message: `Username must be at least ${USERNAME_MIN} characters.` })
      return
    }
    if (value.length > USERNAME_MAX) {
      ctx.addIssue({ code: "custom", message: `Username must be at most ${USERNAME_MAX} characters.` })
      return
    }
    if (!USERNAME_PATTERN.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Username can only contain letters, numbers, dots, hyphens, and underscores.",
      })
    }
  })

export const passwordSchema = z
  .string()
  .min(1, "Enter your password.")
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters.`)

export const loginSchema = z.object({
  identity: identitySchema,
  password: passwordSchema,
})

export type LoginInput = z.infer<typeof loginSchema>
export type LoginFieldErrors = Partial<Pick<LoginInput, "identity" | "password">>
