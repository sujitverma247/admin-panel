import { Navigate, useLocation } from "react-router"
import type { ReactNode } from "react"
import { useAuth } from "@/auth/AuthProvider"

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <div className="h-full bg-[#eef2f7]" />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
