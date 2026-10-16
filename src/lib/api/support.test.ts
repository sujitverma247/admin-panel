import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api/client"
import { ticketStatusLabel, ticketsQuery, toTicketActionError } from "@/lib/api/support"

describe("tickets query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(ticketsQuery()).toBe("/admin/tickets?page=1&limit=10")
    expect(
      ticketsQuery({
        page: 2,
        limit: 50,
        q: " ada ",
        status: "open",
        priority: "high",
        customerId: 4,
        from: "2026-01-01",
        sort: "status",
        dir: "asc",
      }),
    ).toBe(
      "/admin/tickets?page=2&limit=50&q=ada&status=open&priority=high&customerId=4&from=2026-01-01&sort=status&dir=asc",
    )
    expect(ticketsQuery({ limit: 15, status: "all", priority: "all", q: "  " })).toBe("/admin/tickets?page=1&limit=10")
  })
})

describe("ticket labels and errors", () => {
  it("formats status", () => {
    expect(ticketStatusLabel("open")).toBe("Open")
    expect(ticketStatusLabel("waiting")).toBe("Waiting")
  })

  it("maps API messages", () => {
    expect(toTicketActionError(new ApiError(403, "forbidden"), "reply")).toBe(
      "You do not have permission to reply to tickets.",
    )
    expect(toTicketActionError(new ApiError(422, "ticket is closed"), "reply")).toBe(
      "This ticket is closed. Reopen it to reply.",
    )
    expect(toTicketActionError(new ApiError(404, "ticket not found"), "close")).toBe("Ticket not found.")
  })
})
