import { z } from "zod"

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>

export function fieldError(schema: z.ZodType, value: unknown): string | undefined {
  const result = schema.safeParse(value)
  if (result.success) return undefined
  return result.error.issues[0]?.message
}

export function parseForm<T extends z.ZodType>(
  schema: T,
  value: unknown,
): { success: true; data: z.output<T>; errors: FieldErrors } | { success: false; errors: FieldErrors } {
  const result = schema.safeParse(value)
  if (result.success) return { success: true, data: result.data, errors: {} }

  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "")
    if (key && !errors[key]) errors[key] = issue.message
  }
  return { success: false, errors }
}

export function hasFieldErrors(errors: FieldErrors) {
  return Object.keys(errors).length > 0
}
