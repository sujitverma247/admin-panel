import { api } from "@/lib/api/client"
import type { AdminUser } from "@/lib/api/types"

export type LoginResponse = {
  token: string
  expiresAt: string
  user: AdminUser
}

export function login(username: string, password: string) {
  return api<LoginResponse>("/admin/login", {
    method: "POST",
    body: { username, password },
  })
}

export function logout(token: string) {
  return api<{ loggedOut: boolean }>("/admin/logout", { method: "POST", token })
}

export function me(token: string) {
  return api<{ user: AdminUser }>("/admin/me", { token })
}
