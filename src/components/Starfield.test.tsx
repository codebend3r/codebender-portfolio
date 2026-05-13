import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Starfield } from "@components/Starfield"

describe("Starfield", () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    addSpy = vi.spyOn(window, "addEventListener")
    removeSpy = vi.spyOn(window, "removeEventListener")
  })

  afterEach(() => {
    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it("renders three parallax layers with stars inside", () => {
    const { container } = render(<Starfield />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toBeTruthy()
    expect(root.getAttribute("aria-hidden")).toBe("true")
    expect(root.children).toHaveLength(3)
    const totalStars = Array.from(root.children).reduce(
      (sum, layer) => sum + layer.children.length,
      0
    )
    expect(totalStars).toBe(160 + 80 + 30)
  })

  it("subscribes to scroll on mount and unsubscribes on unmount", () => {
    const { unmount } = render(<Starfield />)
    const subscribed = addSpy.mock.calls.some(
      (args: unknown[]) => args[0] === "scroll"
    )
    expect(subscribed).toBe(true)
    unmount()
    const unsubscribed = removeSpy.mock.calls.some(
      (args: unknown[]) => args[0] === "scroll"
    )
    expect(unsubscribed).toBe(true)
  })
})
