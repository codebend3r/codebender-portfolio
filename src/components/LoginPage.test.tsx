import type { Session } from "@supabase/supabase-js"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LoginPage } from "@components/LoginPage"

import { useAuth } from "@state/useAuth"

import { navigate } from "@utils/navigate"

const mockSupabase = vi.hoisted(() => ({
  cloudConfigured: true,
  supabase: null,
}))

vi.mock("@state/supabase", () => mockSupabase)
vi.mock("@utils/navigate", () => ({ navigate: vi.fn() }))

beforeEach(() => {
  mockSupabase.cloudConfigured = true
  useAuth.setState({ session: null, ready: true, error: null })
})

describe("LoginPage", () => {
  it("shows the sign-in form to anonymous visitors", () => {
    render(<LoginPage />)
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /back to resume/i })
    ).toHaveAttribute("href", "/")
    expect(navigate).not.toHaveBeenCalled()
  })

  it("redirects home when already signed in", () => {
    useAuth.setState({ session: {} as Session })
    const { container } = render(<LoginPage />)
    expect(container).toBeEmptyDOMElement()
    expect(navigate).toHaveBeenCalledWith("/")
  })

  it("redirects home when cloud is not configured", () => {
    mockSupabase.cloudConfigured = false
    const { container } = render(<LoginPage />)
    expect(container).toBeEmptyDOMElement()
    expect(navigate).toHaveBeenCalledWith("/")
  })

  it("submits trimmed credentials through signIn", async () => {
    const signIn = vi.fn(async () => true)
    useAuth.setState({ signIn })
    render(<LoginPage />)
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
    render(<LoginPage />)
    expect(screen.getByRole("button", { name: /sign in$/i })).toBeDisabled()
  })

  it("shows auth errors from the store", () => {
    useAuth.setState({ error: "Invalid login credentials" })
    render(<LoginPage />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid login credentials"
    )
  })
})
