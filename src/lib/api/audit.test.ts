import { describe, expect, it } from "vitest"
import { auditActionLabel, auditQuery, auditTone, auditUsername, parseAuditTarget } from "@/lib/api/audit"

describe("audit query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(auditQuery()).toBe("/admin/audit?page=1&limit=10")
    expect(
      auditQuery({
        page: 2,
        limit: 50,
        q: " admin ",
        action: "auth.login",
        user: "admin",
        from: "2026-01-01",
        sort: "action",
        dir: "asc",
      }),
    ).toBe(
      "/admin/audit?page=2&limit=50&q=admin&action=auth.login&user=admin&from=2026-01-01&sort=action&dir=asc",
    )
    expect(auditQuery({ limit: 15, action: "", q: "  " })).toBe("/admin/audit?page=1&limit=10")
  })
})

describe("audit labels", () => {
  it("title-cases dotted actions", () => {
    expect(auditActionLabel("auth.login.failed")).toBe("Auth Login Failed")
    expect(auditActionLabel("key.issue")).toBe("Key Issue")
    expect(auditActionLabel("gateway-plan.create")).toBe("Gateway Plan Create")
  })

  it("maps tones", () => {
    expect(auditTone("auth.login")).toBe("success")
    expect(auditTone("auth.login.failed")).toBe("danger")
    expect(auditTone("key.revoke")).toBe("warning")
    expect(auditTone("ticket.reply")).toBe("muted")
  })

  it("links known targets", () => {
    expect(parseAuditTarget("ticket#5")).toEqual({ to: "/tickets/5", label: "ticket#5" })
    expect(parseAuditTarget("customer#17")).toEqual({ to: "/customers/17", label: "customer#17" })
    expect(parseAuditTarget("admin")).toBeNull()
  })

  it("falls back to the login target when username was not stored", () => {
    expect(auditUsername({ username: "admin", action: "key.issue", target: "key#1" })).toBe("admin")
    expect(auditUsername({ username: "", action: "auth.login", target: "admin" })).toBe("admin")
    expect(auditUsername({ username: "", action: "ticket.open", target: "ticket#6" })).toBe("")
  })
})
