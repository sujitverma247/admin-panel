import { describe, expect, it } from "vitest"
import { P, has } from "@/lib/permissions"

describe("permissions", () => {
  it("detects granted codes", () => {
    expect(has([P.keyRead, P.supportWrite], P.keyRead)).toBe(true)
    expect(has([P.keyRead], P.keyIssue)).toBe(false)
    expect(has(undefined, P.auditRead)).toBe(false)
  })
})
