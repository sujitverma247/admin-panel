export type ApiErrorBody = {
  error: string
}

export type AdminUser = {
  id: number
  username: string
  role: string
  displayName: string
  isActive: boolean
  permissions: string[]
}
