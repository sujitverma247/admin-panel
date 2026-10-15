import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api/client"
import { ordersQuery, toOrderActionError } from "@/lib/api/payments"

describe("orders query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(ordersQuery()).toBe("/admin/orders?page=1&limit=10")
    expect(
      ordersQuery({
        page: 2,
        limit: 50,
        q: " buyer ",
        status: "paid",
        productId: 3,
        gateway: "dev",
        from: "2026-01-01",
        sort: "amount",
        dir: "desc",
      }),
    ).toBe(
      "/admin/orders?page=2&limit=50&q=buyer&status=paid&productId=3&gateway=dev&from=2026-01-01&sort=amount&dir=desc",
    )
    expect(ordersQuery({ limit: 15, status: "all", q: "  " })).toBe("/admin/orders?page=1&limit=10")
  })
})

describe("order action errors", () => {
  it("maps API messages", () => {
    expect(toOrderActionError(new ApiError(403, "forbidden"))).toBe(
      "You do not have permission to mark orders paid.",
    )
    expect(toOrderActionError(new ApiError(422, "order refunded"))).toBe("This order was already refunded.")
  })
})
