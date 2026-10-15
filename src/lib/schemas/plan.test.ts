import { describe, expect, it } from "vitest"
import { emptyPlanDraft, toPlanCode, validatePlanDraft } from "@/lib/schemas/plan"

describe("plan draft", () => {
  it("requires product, name, code, duration, machines, gateway, and gateway plan id", () => {
    const errors = validatePlanDraft(
      {
        ...emptyPlanDraft(),
        productId: "",
        displayName: "",
        code: "",
        durationDays: "",
        defaultMaxMachines: "",
        gateway: "",
        externalPlanId: "",
      },
      "create",
    )
    expect(errors.productId).toBe("Product is required.")
    expect(errors.displayName).toBe("Plan name is required.")
    expect(errors.code).toBe("Plan code is required.")
    expect(errors.durationDays).toBe("Duration is required.")
    expect(errors.defaultMaxMachines).toBe("Max machines is required.")
    expect(errors.gateway).toBe("Payment gateway is required.")
    expect(errors.externalPlanId).toBe("Gateway plan ID is required.")
  })

  it("accepts a complete mapping draft without a local price", () => {
    expect(
      validatePlanDraft(
        {
          ...emptyPlanDraft(),
          productId: "1",
          displayName: "1 Year",
          code: "1year",
          durationDays: "365",
          defaultMaxMachines: "3",
          gateway: "freemius",
          externalPlanId: "68452",
        },
        "create",
      ),
    ).toEqual({})
  })

  it("builds a plan code from the name", () => {
    expect(toPlanCode("1 Year")).toBe("1-year")
  })
})
