import type { Session } from "@supabase/supabase-js"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SideMenu } from "@components/SideMenu"

import { useAuth } from "@state/useAuth"

const mockSupabase = vi.hoisted(() => ({
  cloudConfigured: true,
  supabase: null,
}))

vi.mock("@state/supabase", () => mockSupabase)

beforeEach(() => {
  mockSupabase.cloudConfigured = true
  useAuth.setState({ session: null, ready: true, error: null })
})

describe("SideMenu", () => {
  it("renders nothing for anonymous visitors", () => {
    const { container } = render(<SideMenu />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when cloud is not configured", () => {
    mockSupabase.cloudConfigured = false
    useAuth.setState({ session: {} as Session })
    const { container } = render(<SideMenu />)
    expect(container).toBeEmptyDOMElement()
  })

  it("shows a toggle when signed in and opens the drawer", () => {
    useAuth.setState({ session: {} as Session })
    render(<SideMenu />)

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }))

    const nav = screen.getByRole("navigation", { name: "Site" })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/"
    )
    expect(screen.getByRole("link", { name: "Edit Resume" })).toHaveAttribute(
      "href",
      "/edit-resume"
    )
    expect(
      screen.getByRole("link", { name: "Generate (Proximate)" })
    ).toHaveAttribute("href", "/generate-proximate")
  })

  it("marks the current route with aria-current", () => {
    // jsdom serves tests from "/", so Home is the active route.
    useAuth.setState({ session: {} as Session })
    render(<SideMenu />)
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }))
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(
      screen.getByRole("link", { name: "Generate (Proximate)" })
    ).not.toHaveAttribute("aria-current")
  })

  it("closes on Escape", () => {
    useAuth.setState({ session: {} as Session })
    render(<SideMenu />)
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }))
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
  })

  it("signs out from the drawer", () => {
    const signOut = vi.fn(async () => {})
    useAuth.setState({ session: {} as Session, signOut })
    render(<SideMenu />)
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }))
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }))
    expect(signOut).toHaveBeenCalled()
  })
})
