import type { Session } from "@supabase/supabase-js"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthGate } from "@components/AuthGate"

import { useAuth } from "@state/useAuth"

// Mutable so individual tests can flip the gate off; vitest resolves the
// export on each access.
const mockSupabase = vi.hoisted(() => ({
  cloudConfigured: true,
  supabase: null,
}))

vi.mock("@state/supabase", () => mockSupabase)

beforeEach(() => {
  mockSupabase.cloudConfigured = true
  useAuth.setState({ session: null, ready: true, error: null })
})

describe("AuthGate", () => {
  it("renders children untouched when cloud is not configured", () => {
    mockSupabase.cloudConfigured = false
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(screen.getByText("private")).toBeInTheDocument()
  })

  it("renders nothing until the session is restored", () => {
    useAuth.setState({ ready: false })
    const { container } = render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("shows the sign-in screen instead of children when signed out", () => {
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(screen.queryByText("private")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /back to resume/i })
    ).toHaveAttribute("href", "/")
  })

  it("renders children when a session exists", () => {
    useAuth.setState({ session: {} as Session })
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(screen.getByText("private")).toBeInTheDocument()
  })

  it("submits trimmed credentials through signIn", async () => {
    const signIn = vi.fn(async () => true)
    useAuth.setState({ signIn })
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  cj@example.com  " },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "hunter2" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in$/i }))
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith("cj@example.com", "hunter2")
    )
  })

  it("disables submit until both fields are filled", () => {
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(screen.getByRole("button", { name: /sign in$/i })).toBeDisabled()
  })

  it("shows auth errors from the store", () => {
    useAuth.setState({ error: "Invalid login credentials" })
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid login credentials"
    )
  })
})
