import { useState, type FormEvent } from "react"
import { Navigate } from "react-router"
import { cn } from "@/lib/utils"
import {
  BarChart3Icon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  MonitorIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import { useAuth } from "@/auth/AuthProvider"
import { toLoginError } from "@/lib/api/client"
import {
  EMAIL_MAX,
  PASSWORD_MAX,
  identitySchema,
  loginSchema,
  passwordSchema,
  type LoginFieldErrors,
} from "@/lib/schemas/login"
import { fieldError, parseForm } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const features = [
  {
    icon: KeyRoundIcon,
    title: "License Management",
    body: "Issue, activate and monitor keys",
  },
  {
    icon: UsersIcon,
    title: "Customer Support",
    body: "Handle tickets and customer inquiries",
  },
  {
    icon: BarChart3Icon,
    title: "Payments & Invoices",
    body: "View orders, refunds and invoices",
  },
  {
    icon: MonitorIcon,
    title: "System Telemetry",
    body: "Track activations and device health",
  },
] as const

export function LoginPage() {
  const { user, ready, login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  if (!ready) {
    return <div className="h-full bg-[#eef2f7]" />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    const result = parseForm(loginSchema, { identity: username, password })
    setFieldErrors(result.errors)
    if (!result.success) return

    setPending(true)
    try {
      await login(result.data.identity, result.data.password)
    } catch (err) {
      setError(toLoginError(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="light no-scrollbar flex h-full items-center justify-center overflow-y-auto bg-[#eef2f7] p-4 sm:p-8">
      <div className="grid w-full max-w-[1080px] min-h-[640px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(16,42,96,0.12)] lg:grid-cols-2">
        <aside className="relative overflow-hidden bg-[#0b2468] px-8 py-10 text-white sm:px-10 lg:flex lg:flex-col lg:px-10 lg:py-12">
          <div className="pointer-events-none absolute -top-24 right-[-4.5rem] size-[22rem] rounded-full bg-[#16368a]" />
          <div className="pointer-events-none absolute -bottom-28 -right-16 size-[28rem] rounded-full bg-[#081c54]" />
          <div className="pointer-events-none absolute right-8 bottom-28 size-56 rounded-full bg-[#1a3f96]/70" />

          <div className="relative mb-14 flex items-center gap-3">
            <svg viewBox="0 0 32 32" className="size-11 shrink-0 text-white" aria-hidden="true">
              <path
                fill="currentColor"
                d="M16 3.2 27 8v8.3c0 6.4-4.3 12.1-11 13.8C9.3 28.4 5 22.7 5 16.3V8l11-4.8Z"
              />
              <path
                fill="#0b2468"
                d="m13.1 16.7-2.4-2.4-1.4 1.4 3.8 3.8 7.1-7.1-1.4-1.4z"
              />
            </svg>
            <div>
              <p className="text-[1.35rem] leading-none font-semibold tracking-tight">MasterServer</p>
              <p className="mt-1 text-sm text-white/70">Admin Panel</p>
            </div>
          </div>

          <div className="relative max-w-[22rem]">
            <h1 className="text-[2.15rem] leading-[1.15] font-semibold tracking-tight">
              Manage your software
              <br />
              business with confidence
            </h1>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-white/75">
              Products, licenses, customers, payments, support and more — all in one secure admin panel.
            </p>
          </div>

          <ul className="relative mt-12 space-y-5">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <li key={feature.title} className="flex items-center gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#163a86] text-[#8ec5ff]">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="text-[0.8rem] text-white/65">{feature.body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </aside>

        <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-[400px]">
          <h2 className="text-[2rem] font-bold tracking-tight text-[#0b1f5c]">Welcome back</h2>
          <p className="mt-1 text-[0.95rem] text-[#8b93a7]">Sign in to your admin account</p>

          <form className="mt-10 space-y-5" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-[#1b2a4a]">
                Username or Email
              </Label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-[#9aa3b5]" />
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  maxLength={EMAIL_MAX}
                  aria-invalid={Boolean(fieldErrors.identity)}
                  aria-describedby={fieldErrors.identity ? "identity-error" : undefined}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    if (fieldErrors.identity) {
                      setFieldErrors((current) => ({ ...current, identity: undefined }))
                    }
                  }}
                  onBlur={() => {
                    if (!username.trim()) return
                    setFieldErrors((current) => ({
                      ...current,
                      identity: fieldError(identitySchema, username),
                    }))
                  }}
                  placeholder="Enter your username or email"
                  className={cn(
                    "h-12 rounded-xl border-[#e4e8f0] bg-white pr-3 pl-10 text-[0.95rem] text-[#1b2a4a] shadow-none placeholder:text-[#b0b7c6] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20",
                    fieldErrors.identity && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                  )}
                />
              </div>
              {fieldErrors.identity ? (
                <p id="identity-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.identity}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-[#1b2a4a]">
                Password
              </Label>
              <div className="relative">
                <LockKeyholeIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-[#9aa3b5]" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  maxLength={PASSWORD_MAX}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (fieldErrors.password) {
                      setFieldErrors((current) => ({ ...current, password: undefined }))
                    }
                  }}
                  onBlur={() => {
                    if (!password) return
                    setFieldErrors((current) => ({
                      ...current,
                      password: fieldError(passwordSchema, password),
                    }))
                  }}
                  placeholder="Enter your password"
                  className={cn(
                    "h-12 rounded-xl border-[#e4e8f0] bg-white pr-11 pl-10 text-[0.95rem] text-[#1b2a4a] shadow-none placeholder:text-[#b0b7c6] focus-visible:border-[#3b6cff] focus-visible:ring-[#3b6cff]/20",
                    fieldErrors.password && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                  )}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-[#9aa3b5] hover:text-[#6b7385]"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-xl bg-[#3b6cff] text-base font-medium text-white hover:bg-[#2f5ef0] disabled:opacity-70"
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          </div>
        </section>
      </div>
    </div>
  )
}
