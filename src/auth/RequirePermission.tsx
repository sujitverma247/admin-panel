import type { ReactNode } from "react"
import { Navigate } from "react-router"
import { useAuth } from "@/auth/AuthProvider"
import { has, type Permission } from "@/lib/permissions"

export function RequirePermission({
  code,
  children,
}: {
  code: Permission
  children: ReactNode
}) {
  const { user } = useAuth()
  if (!has(user?.permissions, code)) {
    return <Navigate to="/" replace />
  }
  return children
}
