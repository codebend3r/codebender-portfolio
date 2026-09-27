import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ChatLauncher } from "./ChatLauncher"

describe("ChatLauncher", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("renders nothing when the flag is off", () => {
    vi.stubEnv("VITE_CHAT_ENABLED", "false")
    const { container } = render(<ChatLauncher />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when the flag is unset", () => {
    vi.stubEnv("VITE_CHAT_ENABLED", "")
    const { container } = render(<ChatLauncher />)
    expect(container).toBeEmptyDOMElement()
  })

  describe("when enabled", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_CHAT_ENABLED", "true")
    })

    it("renders a pill button named 'Ask about CJ', collapsed", () => {
      render(<ChatLauncher />)
      const button = screen.getByRole("button", { name: "Ask about CJ" })
      expect(button).toHaveAttribute("aria-expanded", "false")
      expect(button).toHaveAttribute("aria-controls")
    })

    it("opens the panel and focuses the textarea on click, then hides itself", async () => {
      const user = userEvent.setup()
      render(<ChatLauncher />)
      const button = screen.getByRole("button", { name: "Ask about CJ" })

      await user.click(button)

      await waitFor(() =>
        expect(screen.getByLabelText("Your question")).toHaveFocus()
      )
      expect(button).not.toBeVisible()
      expect(button).toHaveAttribute("aria-expanded", "true")
    })

    it("opens on Enter", async () => {
      const user = userEvent.setup()
      render(<ChatLauncher />)
      screen.getByRole("button", { name: "Ask about CJ" }).focus()

      await user.keyboard("{Enter}")

      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Ask about CJ" })
        ).toBeInTheDocument()
      )
    })

    it("wires aria-controls to the rendered dialog's id", async () => {
      const user = userEvent.setup()
      render(<ChatLauncher />)
      const button = screen.getByRole("button", { name: "Ask about CJ" })
      const controlsId = button.getAttribute("aria-controls")

      await user.click(button)

      await waitFor(() => {
        const dialog = document.getElementById(controlsId ?? "")
        expect(dialog).not.toBeNull()
      })
    })
  })
})
