import { describe, expect, it } from "vitest"
import { emptyIssueKeyDraft, validateEditKeyDraft, validateIssueKeyDraft } from "@/lib/schemas/key"

describe("issue key draft", () => {
  it("requires product, email, plan, and max devices", () => {
    const errors = validateIssueKeyDraft({
      ...emptyIssueKeyDraft(),
      productId: "",
      customerEmail: "",
      planType: "",
      maxMachines: "",
    })
    expect(errors.productId).toBe("Product is required.")
    expect(errors.customerEmail).toBe("Customer email is required.")
    expect(errors.planType).toBe("Plan is required.")
    expect(errors.maxMachines).toBe("Max devices is required.")
  })

  it("accepts a complete issue draft", () => {
    expect(
      validateIssueKeyDraft({
        productId: "1",
        customerEmail: "buyer@example.com",
        name: "Jane Buyer",
        planType: "1year",
        maxMachines: "3",
        notes: "Retail",
      }),
    ).toEqual({})
  })
})

describe("edit key draft", () => {
  it("allows an empty email and requires plan and devices", () => {
    expect(
      validateEditKeyDraft({
        customerEmail: "",
        planType: "1year",
        maxMachines: "3",
        notes: "",
      }),
    ).toEqual({})
    expect(validateEditKeyDraft({ customerEmail: "bad", planType: "1year", maxMachines: "3", notes: "" }).customerEmail).toBe(
      "Enter a valid customer email.",
    )
    expect(validateEditKeyDraft({ customerEmail: "", planType: "", maxMachines: "", notes: "" }).planType).toBe("Plan is required.")
  })
})
