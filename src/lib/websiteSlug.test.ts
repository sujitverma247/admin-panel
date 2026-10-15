import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api/client"
import { brandsQuery, productsQuery, toWebsiteDeleteError, toWebsiteError } from "@/lib/api/catalog"
import { emptyWebsiteDraft, isHttpUrl, validateWebsiteDraft, WEBSITE_NAME_MAX } from "@/lib/schemas/website"
import { isWebsiteSlug, toWebsiteSlug } from "@/lib/websiteSlug"

describe("website slug", () => {
  it("builds and validates slugs", () => {
    expect(toWebsiteSlug("Core Security")).toBe("core-security")
    expect(toWebsiteSlug("  Data Safe!! ")).toBe("data-safe")
    expect(isWebsiteSlug("core-security")).toBe(true)
    expect(isWebsiteSlug("A")).toBe(false)
    expect(isWebsiteSlug("Bad Slug")).toBe(false)
  })
})

describe("website errors", () => {
  it("maps API errors to website copy", () => {
    expect(toWebsiteError(new ApiError(400, "missing name"))).toBe("Website name is required.")
    expect(toWebsiteError(new ApiError(400, "name too short"))).toBe("Website name must be 2–200 characters.")
    expect(toWebsiteError(new ApiError(400, "websiteUrl too long"))).toBe("Website URL must be 10–512 characters.")
    expect(toWebsiteError(new ApiError(409, "slug already exists"))).toBe("A website with this slug already exists.")
    expect(toWebsiteError(new ApiError(404, "brand not found"))).toBe("Website not found.")
    expect(toWebsiteError(new ApiError(400, "logoUrl must be an http(s) URL"))).toBe(
      "Enter a valid logo URL starting with http:// or https://.",
    )
    expect(toWebsiteDeleteError(new ApiError(403, "forbidden"))).toBe(
      "You do not have permission to delete websites.",
    )
  })

  it("validates every website field", () => {
    expect(validateWebsiteDraft(emptyWebsiteDraft(), "create").name).toBe("Website name is required.")
    expect(validateWebsiteDraft({ ...emptyWebsiteDraft(), name: "Acme" }, "create").slug).toBe(
      "Website slug is required.",
    )
    expect(
      validateWebsiteDraft({ ...emptyWebsiteDraft(), name: "Acme", slug: "Bad Slug" }, "create").slug,
    ).toBe("Website slug must be 2–64 characters of a–z, 0–9, and hyphen.")
    expect(
      validateWebsiteDraft(
        { ...emptyWebsiteDraft(), name: "Acme", slug: "acme", websiteUrl: "ftp://example.com" },
        "create",
      ).websiteUrl,
    ).toMatch(/http/)
    expect(
      validateWebsiteDraft(
        { ...emptyWebsiteDraft(), name: "Acme", slug: "acme", logoUrl: "ftp://example.com/logo.png" },
        "create",
      ).logoUrl,
    ).toMatch(/logo URL/)
    expect(
      validateWebsiteDraft(
        { ...emptyWebsiteDraft(), name: "Acme", slug: "acme", supportEmail: "not-an-email" },
        "create",
      ).supportEmail,
    ).toBe("Enter a valid support email.")
    expect(validateWebsiteDraft({ ...emptyWebsiteDraft(), name: "A", slug: "acme" }, "create").name).toBe(
      "Website name must be 2–200 characters.",
    )
    expect(
      validateWebsiteDraft({ ...emptyWebsiteDraft(), name: "A".repeat(WEBSITE_NAME_MAX + 1), slug: "acme" }, "create")
        .name,
    ).toBe("Website name must be 2–200 characters.")
    expect(validateWebsiteDraft({ ...emptyWebsiteDraft(), name: "Acme", slug: "a" }, "create").slug).toMatch(/2–64/)
    expect(
      validateWebsiteDraft({ ...emptyWebsiteDraft(), name: "Acme", slug: "acme", websiteUrl: "https" }, "create")
        .websiteUrl,
    ).toBe("Website URL must be 10–512 characters.")
    expect(
      validateWebsiteDraft({ ...emptyWebsiteDraft(), name: "Acme", slug: "acme", supportEmail: "a@b.c" }, "create")
        .supportEmail,
    ).toBe("Support email must be 6–256 characters.")
    expect(validateWebsiteDraft({ ...emptyWebsiteDraft(), name: "Acme", slug: "acme" }, "create")).toEqual({})
    expect(isHttpUrl("https://cdn.example.com/logo.png")).toBe(true)
    expect(isHttpUrl("javascript:alert(1)")).toBe(false)
  })
})

describe("brands query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(brandsQuery()).toBe("/admin/brands?page=1&limit=10")
    expect(brandsQuery({ page: 2, limit: 50, q: " acme ", status: "active", from: "2026-01-01", sort: "name", dir: "asc" })).toBe(
      "/admin/brands?page=2&limit=50&q=acme&status=active&from=2026-01-01&sort=name&dir=asc",
    )
    expect(brandsQuery({ limit: 15, status: "all", q: "  " })).toBe("/admin/brands?page=1&limit=10")
  })
})

describe("products query", () => {
  it("sends allowed page sizes and website filter", () => {
    expect(productsQuery()).toBe("/admin/products?page=1&limit=10")
    expect(
      productsQuery({ page: 2, limit: 20, q: " vpn ", status: "active", brandId: 3, sort: "name", dir: "asc" }),
    ).toBe("/admin/products?page=2&limit=20&q=vpn&status=active&brandId=3&sort=name&dir=asc")
  })
})
