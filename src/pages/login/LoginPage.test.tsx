import { MemoryRouter } from "react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { AuthProvider } from "@/auth/AuthProvider"
import { LoginPage } from "@/pages/login/LoginPage"

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe("LoginPage", () => {
  it("renders the welcome copy and feature list", async () => {
    renderLogin()
    expect(await screen.findByText("Welcome back")).toBeInTheDocument()
    expect(screen.getByText("Sign in to your admin account")).toBeInTheDocument()
    expect(screen.getByLabelText("Username or Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument()
    expect(screen.getByText("License Management")).toBeInTheDocument()
    expect(screen.getByText("Customer Support")).toBeInTheDocument()
    expect(screen.getByText("Payments & Invoices")).toBeInTheDocument()
    expect(screen.getByText("System Telemetry")).toBeInTheDocument()
  })

  it("shows field errors for empty, invalid email, and short password", async () => {
    const user = userEvent.setup()
    renderLogin()
    const submit = await screen.findByRole("button", { name: "Sign in" })

    await user.click(submit)
    expect(screen.getByText("Enter your username or email.")).toBeInTheDocument()
    expect(screen.getByText("Enter your password.")).toBeInTheDocument()

    await user.type(screen.getByLabelText("Username or Email"), "not-an-email@")
    await user.type(screen.getByLabelText("Password"), "short")
    await user.click(submit)
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument()
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument()
  })
})
