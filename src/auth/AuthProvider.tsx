import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { login as loginRequest, logout as logoutRequest, me } from "@/lib/api/auth"
import type { AdminUser } from "@/lib/api/types"
import { clearSession, getToken, setSession } from "@/auth/session"

type AuthContextValue = {
  user: AdminUser | null
  token: string | null
  ready: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(() => getToken())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = getToken()
    if (!stored) {
      setReady(true)
      return
    }

    me(stored)
      .then((result) => {
        setUser(result.user)
        setToken(stored)
      })
      .catch(() => {
        clearSession()
        setUser(null)
        setToken(null)
      })
      .finally(() => setReady(true))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      async login(username, password) {
        const result = await loginRequest(username, password)
        setSession(result.token, result.expiresAt)
        setToken(result.token)
        setUser(result.user)
      },
      async logout() {
        const current = getToken()
        if (current) {
          try {
            await logoutRequest(current)
          } catch {
            // Local session still clears.
          }
        }
        clearSession()
        setToken(null)
        setUser(null)
      },
    }),
    [user, token, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
