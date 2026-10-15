import { describe, expect, it } from "vitest"
import { fieldError, parseForm } from "@/lib/validation"
import {
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  USERNAME_MAX,
  identitySchema,
  loginSchema,
  passwordSchema,
} from "@/lib/schemas/login"

describe("identitySchema", () => {
  it("requires a value", () => {
    expect(fieldError(identitySchema, "")).toMatch(/enter your username or email/i)
    expect(fieldError(identitySchema, "   ")).toMatch(/enter your username or email/i)
  })

  it("accepts a username", () => {
    expect(fieldError(identitySchema, "admin")).toBeUndefined()
    expect(fieldError(identitySchema, "  agent.1  ")).toBeUndefined()
  })

  it("rejects a short or long username", () => {
    expect(fieldError(identitySchema, "ab")).toMatch(/at least 3/)
    expect(fieldError(identitySchema, "a".repeat(USERNAME_MAX + 1))).toMatch(/at most 64/)
  })

  it("rejects username characters outside the allowed set", () => {
    expect(fieldError(identitySchema, "admin!")).toMatch(/letters, numbers/)
    expect(fieldError(identitySchema, "admin user")).toMatch(/letters, numbers/)
  })

  it("accepts a valid email", () => {
    expect(fieldError(identitySchema, "admin@example.com")).toBeUndefined()
    expect(fieldError(identitySchema, "  User.Name+tag@Brand-1.co.uk  ")).toBeUndefined()
  })

  it("rejects an invalid email", () => {
    expect(fieldError(identitySchema, "admin@")).toMatch(/valid email/)
    expect(fieldError(identitySchema, "admin@localhost")).toMatch(/valid email/)
    expect(fieldError(identitySchema, "not an email@")).toMatch(/valid email/)
    expect(fieldError(identitySchema, `a@b.c${"x".repeat(EMAIL_MAX)}`)).toMatch(/at most 256/)
  })
})

describe("passwordSchema", () => {
  it("requires a value", () => {
    expect(fieldError(passwordSchema, "")).toMatch(/enter your password/i)
  })

  it("enforces min and max length", () => {
    expect(fieldError(passwordSchema, "1234567")).toMatch(new RegExp(`at least ${PASSWORD_MIN}`))
    expect(fieldError(passwordSchema, "x".repeat(PASSWORD_MAX + 1))).toMatch(
      new RegExp(`at most ${PASSWORD_MAX}`),
    )
    expect(fieldError(passwordSchema, "admin_dev_pw_2026")).toBeUndefined()
  })
})

describe("loginSchema", () => {
  it("returns both field errors when empty", () => {
    const result = parseForm(loginSchema, { identity: "", password: "" })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.identity).toBeTruthy()
    expect(result.errors.password).toBeTruthy()
  })

  it("returns parsed data for a valid username login", () => {
    const result = parseForm(loginSchema, { identity: "  admin  ", password: "admin_dev_pw_2026" })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toEqual({ identity: "admin", password: "admin_dev_pw_2026" })
  })
})
