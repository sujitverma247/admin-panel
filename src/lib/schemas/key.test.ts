import { describe, expect, it } from "vitest"
import {
  DEFAULT_MANUAL_YEAR_PLANS,
  emptyIssueKeyDraft,
  manualKeyPlanOptions,
  validateEditKeyDraft,
  validateIssueKeyDraft,
} from "@/lib/schemas/key"

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
        locale: "en",
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

describe("manual key plan options", () => {
  it("always offers 1 through 10 years", () => {
    const options = manualKeyPlanOptions([])
    expect(options.map((plan) => plan.code)).toEqual(DEFAULT_MANUAL_YEAR_PLANS.map((plan) => plan.code))
    expect(options[0]?.displayName).toBe("1 Year")
    expect(options[2]?.displayName).toBe("3 Years")
    expect(options[9]?.displayName).toBe("10 Years")
  })

  it("keeps extra catalog plans such as lifetime after the year list", () => {
    const options = manualKeyPlanOptions([
      { id: 1, code: "1year", displayName: "Personal 1 Year", durationDays: 365, defaultMaxMachines: 1, isActive: true },
      { id: 2, code: "lifetime", displayName: "Lifetime", durationDays: 36500, defaultMaxMachines: 3, isActive: true },
      { id: 3, code: "monthly", displayName: "Monthly", durationDays: 30, defaultMaxMachines: 3, isActive: false },
    ])
    expect(options.map((plan) => plan.code)).toEqual([...DEFAULT_MANUAL_YEAR_PLANS.map((plan) => plan.code), "lifetime"])
    expect(options.find((plan) => plan.code === "1year")?.displayName).toBe("1 Year")
  })
})
