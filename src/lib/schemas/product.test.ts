import { describe, expect, it } from "vitest"
import { emptyProductDraft, validateProductDraft } from "@/lib/schemas/product"

describe("product draft", () => {
  it("requires name, slug, website, app key, and user agent on create", () => {
    const errors = validateProductDraft(emptyProductDraft(), "create")
    expect(errors.displayName).toBe("Product name is required.")
    expect(errors.slug).toBe("Product slug is required.")
    expect(errors.brandId).toBe("Website is required.")
    expect(errors.appKey).toBe("App key is required.")
    expect(errors.userAgentPrefix).toBe("User agent prefix is required.")
  })

  it("accepts a complete create draft without hmac", () => {
    expect(
      validateProductDraft(
        {
          ...emptyProductDraft(),
          displayName: "Acme VPN",
          slug: "acme-vpn",
          brandId: "1",
          appKey: "APP-1",
          userAgentPrefix: "AcmeVPN/",
        },
        "create",
      ),
    ).toEqual({})
  })
})
