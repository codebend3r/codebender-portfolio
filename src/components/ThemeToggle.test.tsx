import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { ThemeToggle } from "@components/ThemeToggle"

import { useTheme } from "@state/useTheme"

describe("ThemeToggle", () => {
  beforeEach(() => {
    useTheme.setState({ choice: "auto" })
    window.localStorage.clear()
  })

  afterEach(() => {
    useTheme.setState({ choice: "auto" })
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    document.documentElement.removeAttribute("style")
  })

  it("renders a labelled group with all three options", () => {
    render(<ThemeToggle />)
    const group = screen.getByRole("group", { name: "Color theme" })
    ;["Light", "Dark", "Auto"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    })
    expect(group).toContainElement(screen.getByRole("button", { name: "Auto" }))
  })

  it("marks the current choice as pressed", () => {
    render(<ThemeToggle />)
    expect(screen.getByRole("button", { name: "Auto" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("stores the picked choice and repaints the theme", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await user.click(screen.getByRole("button", { name: "Dark" }))

    expect(useTheme.getState().choice).toBe("dark")
    expect(window.localStorage.getItem("theme-choice")).toBe("dark")
    expect(document.documentElement.dataset.theme).toBe("dark")
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })
})
