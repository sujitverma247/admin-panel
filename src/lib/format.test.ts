import { describe, expect, it } from "vitest"
import { formatDayLabel, formatSignedInt, formatSignedPct, titleStatus } from "@/lib/format"

describe("dashboard formatters", () => {
  it("formats signed deltas", () => {
    expect(formatSignedPct(12)).toBe("+12%")
    expect(formatSignedPct(-4)).toBe("-4%")
    expect(formatSignedInt(3)).toBe("+3")
    expect(formatSignedInt(-1)).toBe("-1")
  })

  it("formats utc day labels and statuses", () => {
    expect(formatDayLabel("2026-10-15")).toMatch(/oct/i)
    expect(formatDayLabel("2026-10-15")).toMatch(/15/)
    expect(formatDayLabel("2026-10")).toMatch(/oct/i)
    expect(formatDayLabel("2026-10")).toMatch(/2026/)
    expect(titleStatus("paid")).toBe("Paid")
    expect(titleStatus("waiting")).toBe("Waiting")
  })
})
