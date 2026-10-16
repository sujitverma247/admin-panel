import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api/client"
import { roleLabel, toUserError, usersQuery } from "@/lib/api/users"
import { emptyUserDraft, validateUserDraft } from "@/lib/schemas/user"

describe("users query", () => {
  it("sends allowed page sizes and skips empty filters", () => {
    expect(usersQuery()).toBe("/admin/users?page=1&limit=10")
    expect(
      usersQuery({
        page: 2,
        limit: 50,
        q: " admin ",
        role: "agent",
        status: "active",
        from: "2026-01-01",
        sort: "username",
        dir: "asc",
      }),
    ).toBe(
      "/admin/users?page=2&limit=50&q=admin&role=agent&status=active&from=2026-01-01&sort=username&dir=asc",
    )
    expect(usersQuery({ limit: 15, status: "all", q: "  ", role: "" })).toBe("/admin/users?page=1&limit=10")
  })
})

describe("user draft", () => {
  it("requires username, role, and a strong enough password on create", () => {
    expect(validateUserDraft(emptyUserDraft()).username).toBe("Username is required.")
    expect(validateUserDraft({ ...emptyUserDraft(), username: "a" }).username).toBe(
      "Username must be at least 2 characters.",
    )
    expect(validateUserDraft({ ...emptyUserDraft(), username: "bad name" }).username).toBe(
      "Use letters, numbers, dots, hyphens, and underscores.",
    )
    expect(validateUserDraft({ ...emptyUserDraft(), username: "agent1", password: "short" }).password).toBe(
      "Password must be at least 8 characters.",
    )
    expect(validateUserDraft({ ...emptyUserDraft(), username: "agent1", password: "secret12" })).toEqual({})
  })

  it("allows an empty password on edit", () => {
    expect(
      validateUserDraft({ ...emptyUserDraft(), username: "admin", role: "admin", password: "" }, "edit"),
    ).toEqual({})
    expect(
      validateUserDraft({ ...emptyUserDraft(), username: "admin", role: "admin", password: "short" }, "edit")
        .password,
    ).toBe("Password must be at least 8 characters.")
  })
})

describe("user labels and errors", () => {
  it("title-cases roles and maps API messages", () => {
    expect(roleLabel("admin")).toBe("Admin")
    expect(roleLabel("agent")).toBe("Agent")
    expect(toUserError(new ApiError(409, "username already exists"))).toBe("That username is already taken.")
    expect(toUserError(new ApiError(422, "cannot deactivate yourself"))).toBe(
      "You cannot deactivate your own account.",
    )
    expect(toUserError(new ApiError(422, "cannot remove the last admin"))).toBe(
      "Keep at least one active admin user.",
    )
    expect(toUserError(new ApiError(403, "forbidden"))).toBe("You do not have permission to manage admin users.")
  })
})
