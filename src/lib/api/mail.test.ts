import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api/client"
import { mailLocaleLabel, mailQuery, mailTemplateLabel, toMailActionError } from "@/lib/api/mail"

describe("mail query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(mailQuery()).toBe("/admin/mail?page=1&limit=10")
    expect(
      mailQuery({
        page: 2,
        limit: 50,
        q: " ada ",
        status: "failed",
        template: "license.issued",
        customerId: 4,
        from: "2026-01-01",
        sort: "status",
        dir: "asc",
      }),
    ).toBe(
      "/admin/mail?page=2&limit=50&q=ada&status=failed&template=license.issued&customerId=4&from=2026-01-01&sort=status&dir=asc",
    )
    expect(mailQuery({ limit: 15, status: "all", q: "  " })).toBe("/admin/mail?page=1&limit=10")
  })
})

describe("mail labels and errors", () => {
  it("formats template ids", () => {
    expect(mailTemplateLabel("license.issued")).toBe("License Issued")
    expect(mailTemplateLabel("order.refunded")).toBe("Order Refunded")
  })

  it("labels mail language", () => {
    expect(mailLocaleLabel("")).toBe("English")
    expect(mailLocaleLabel("en")).toBe("English")
    expect(mailLocaleLabel("de")).toBe("German")
    expect(mailLocaleLabel("de-DE")).toBe("German")
  })

  it("maps API messages", () => {
    expect(toMailActionError(new ApiError(403, "forbidden"), "resend")).toBe(
      "You do not have permission to resend mail.",
    )
    expect(toMailActionError(new ApiError(403, "forbidden"), "flush")).toBe(
      "You do not have permission to flush the mail queue.",
    )
    expect(toMailActionError(new ApiError(404, "mail not found"), "resend")).toBe("Mail not found.")
  })
})
