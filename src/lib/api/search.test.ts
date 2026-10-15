import { describe, expect, it } from "vitest"
import { searchKindLabel } from "@/lib/api/search"

describe("search labels", () => {
  it("names each result group", () => {
    expect(searchKindLabel("customer")).toBe("Customers")
    expect(searchKindLabel("order")).toBe("Orders")
    expect(searchKindLabel("key")).toBe("License keys")
    expect(searchKindLabel("ticket")).toBe("Tickets")
  })
})
