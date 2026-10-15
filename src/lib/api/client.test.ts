import { describe, expect, it } from "vitest"
import { ApiError, NetworkError, toLoginError } from "@/lib/api/client"

describe("toLoginError", () => {
  it("maps network failure", () => {
    expect(toLoginError(new NetworkError())).toMatch(/unable to reach the server/i)
  })

  it("maps credential failure", () => {
    expect(toLoginError(new ApiError(401, "invalid credentials"))).toBe(
      "Incorrect username or password.",
    )
  })

  it("maps missing fields and server errors", () => {
    expect(toLoginError(new ApiError(400, "missing username or password"))).toBe(
      "Enter your username and password.",
    )
    expect(toLoginError(new ApiError(500, "internal error"))).toBe(
      "Something went wrong. Please try again.",
    )
  })

  it("does not leak unknown error objects", () => {
    expect(toLoginError(new Error("ECONNREFUSED"))).toBe("Unable to sign in. Please try again.")
  })
})
