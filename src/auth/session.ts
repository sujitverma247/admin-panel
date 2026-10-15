export const SESSION_TOKEN_KEY = "admin.token"
export const SESSION_EXPIRES_KEY = "admin.expiresAt"

export function getToken() {
  return sessionStorage.getItem(SESSION_TOKEN_KEY)
}

export function setSession(token: string, expiresAt: string) {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token)
  sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt)
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
  sessionStorage.removeItem(SESSION_EXPIRES_KEY)
}
