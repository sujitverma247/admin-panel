import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api/client"
import { invoicesQuery, toInvoiceActionError } from "@/lib/api/invoices"

describe("invoices query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(invoicesQuery()).toBe("/admin/invoices?page=1&limit=10")
    expect(
      invoicesQuery({
        page: 2,
        limit: 50,
        q: " INV-1 ",
        status: "issued",
        gateway: "dev",
        customerId: 4,
        from: "2026-01-01",
        sort: "amount",
        dir: "desc",
      }),
    ).toBe(
      "/admin/invoices?page=2&limit=50&q=INV-1&status=issued&gateway=dev&customerId=4&from=2026-01-01&sort=amount&dir=desc",
    )
    expect(invoicesQuery({ limit: 15, status: "all", q: "  " })).toBe("/admin/invoices?page=1&limit=10")
  })
})

describe("invoice action errors", () => {
  it("maps API messages", () => {
    expect(toInvoiceActionError(new ApiError(403, "forbidden"), "pdf")).toBe(
      "You do not have permission to download invoices.",
    )
    expect(toInvoiceActionError(new ApiError(403, "forbidden"), "void")).toBe(
      "You do not have permission to cancel invoices.",
    )
    expect(toInvoiceActionError(new ApiError(404, "invoice not found"), "void")).toBe("Invoice not found.")
  })
})
