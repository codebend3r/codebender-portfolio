import type { Session } from "@supabase/supabase-js"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthGate } from "@components/AuthGate"

import { useAuth } from "@state/useAuth"

import { navigate } from "@utils/navigate"

// Mutable so individual tests can flip the gate off; vitest resolves the
// export on each access.
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

describe("AuthGate", () => {
  it("renders children untouched when cloud is not configured", () => {
    mockSupabase.cloudConfigured = false
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(screen.getByText("private")).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it("renders nothing and stays put until the session is restored", () => {
    useAuth.setState({ ready: false })
    const { container } = render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(container).toBeEmptyDOMElement()
    expect(navigate).not.toHaveBeenCalled()
  })

  it("redirects anonymous visitors to the homepage", () => {
    const { container } = render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(container).toBeEmptyDOMElement()
    expect(navigate).toHaveBeenCalledWith("/")
  })

  it("renders children when a session exists", () => {
    useAuth.setState({ session: {} as Session })
    render(
      <AuthGate>
        <p>private</p>
      </AuthGate>
    )
    expect(screen.getByText("private")).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})
