import { describe, expect, it } from "vitest"
import { heartbeatsQuery } from "@/lib/api/heartbeats"

describe("heartbeats query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(heartbeatsQuery()).toBe("/admin/heartbeats?page=1&limit=10")
    expect(
      heartbeatsQuery({
        page: 2,
        limit: 50,
        q: " desk ",
        productId: 4,
        activationId: 10,
        from: "2026-01-01",
        sort: "machine",
        dir: "asc",
      }),
    ).toBe(
      "/admin/heartbeats?page=2&limit=50&q=desk&productId=4&activationId=10&from=2026-01-01&sort=machine&dir=asc",
    )
    expect(heartbeatsQuery({ limit: 15, q: "  ", productId: 0, activationId: 0 })).toBe(
      "/admin/heartbeats?page=1&limit=10",
    )
  })
})
