import { describe, expect, it } from "vitest"
import {
  chartBucketKind,
  formatChartMetric,
  formatChartPointLabel,
  formatChartTick,
  formatDayLabel,
  formatRange,
  formatSignedInt,
  formatSignedPct,
  sparseChartLabels,
  titleStatus,
} from "@/lib/format"

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
    expect(formatRange("2026-09-16", "2026-10-15")).toMatch(/sep/i)
    expect(formatRange("2026-09-16", "2026-10-15")).toMatch(/oct/i)
  })

  it("thins chart ticks so long ranges do not overlap", () => {
    expect(formatChartTick("2026-10")).toMatch(/oct/i)
    expect(formatChartTick("2026-10")).not.toMatch(/2026/)

    const month = Array.from({ length: 30 }, (_, i) => {
      const day = i + 1
      return `2026-09-${String(day).padStart(2, "0")}`
    })
    const ticks = sparseChartLabels(month, 6)
    expect(ticks).toHaveLength(30)
    expect(ticks.filter(Boolean).length).toBeLessThanOrEqual(6)
    expect(ticks[0]).toBeTruthy()
    expect(ticks[29]).toBeTruthy()

    const year = [
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]
    const yearTicks = sparseChartLabels(year)
    expect(yearTicks).toHaveLength(12)
    expect(yearTicks.every(Boolean)).toBe(true)
  })

  it("formats chart hover copy from the bucket kind", () => {
    expect(chartBucketKind(["2026-10-09", "2026-10-10"])).toBe("day")
    expect(chartBucketKind(["2026-10-01", "2026-10-08"])).toBe("week")
    expect(chartBucketKind(["2025-10", "2025-11"])).toBe("month")
    expect(formatChartPointLabel("2026-10-14")).toMatch(/oct/i)
    expect(formatChartPointLabel("2026-10-14")).toMatch(/14/)
    expect(formatChartPointLabel("2026-10-14")).toMatch(/2026/)
    expect(formatChartPointLabel("2026-10-01", "week")).toMatch(/week of/i)
    expect(formatChartPointLabel("2026-10", "month")).toMatch(/october/i)
    expect(formatChartMetric(1, "paid order")).toBe("1 paid order")
    expect(formatChartMetric(10, "activation")).toBe("10 activations")
  })
})
