import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api/client"
import { customersQuery, toCustomerError } from "@/lib/api/customers"
import { emptyCustomerDraft, validateCustomerDraft } from "@/lib/schemas/customer"

describe("customers query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(customersQuery()).toBe("/admin/customers?page=1&limit=10")
    expect(
      customersQuery({
        page: 2,
        limit: 50,
        q: " buyer ",
        status: "active",
        source: "manual",
        from: "2026-01-01",
        sort: "email",
        dir: "asc",
      }),
    ).toBe(
      "/admin/customers?page=2&limit=50&q=buyer&status=active&source=manual&from=2026-01-01&sort=email&dir=asc",
    )
    expect(customersQuery({ limit: 15, status: "all", q: "  " })).toBe("/admin/customers?page=1&limit=10")
  })
})

describe("customer draft", () => {
  it("requires a valid email and caps name and notes", () => {
    expect(validateCustomerDraft(emptyCustomerDraft()).email).toBe("Email is required.")
    expect(validateCustomerDraft({ ...emptyCustomerDraft(), email: "not-an-email" }).email).toBe(
      "Enter a valid customer email.",
    )
    expect(validateCustomerDraft({ ...emptyCustomerDraft(), email: "buyer@example.com" })).toEqual({})
    expect(
      validateCustomerDraft({ ...emptyCustomerDraft(), email: "buyer@example.com", displayName: "x".repeat(201) })
        .displayName,
    ).toBe("Name must be at most 200 characters.")
    expect(
      validateCustomerDraft({ ...emptyCustomerDraft(), email: "buyer@example.com", phone: "1".repeat(33) }).phone,
    ).toBe("Phone must be at most 32 characters.")
  })
})

describe("customer errors", () => {
  it("maps API messages", () => {
    expect(toCustomerError(new ApiError(409, "email already exists"))).toBe("A customer with this email already exists.")
    expect(toCustomerError(new ApiError(400, "invalid email"))).toBe("Enter a valid customer email.")
    expect(toCustomerError(new ApiError(400, "phone too long"))).toBe("Phone must be at most 32 characters.")
    expect(toCustomerError(new ApiError(403, "forbidden"))).toBe("You do not have permission to change customers.")
  })
})
