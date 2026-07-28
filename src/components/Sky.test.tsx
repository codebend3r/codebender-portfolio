import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Sky } from "@components/Sky"

import { getCurrentSky } from "@sky"

vi.mock("@sky", () => ({
  getCurrentSky: vi.fn(() => "night"),
}))

const mockedGetCurrentSky = vi.mocked(getCurrentSky)

describe("Sky", () => {
  beforeEach(() => {
    mockedGetCurrentSky.mockReturnValue("night")
  })

  afterEach(() => {
    mockedGetCurrentSky.mockReset()
  })

  it("renders the starfield + moon at night", () => {
    mockedGetCurrentSky.mockReturnValue("night")
    const { container } = render(<Sky />)
    const root = container.firstElementChild as HTMLElement
    expect(root.getAttribute("aria-hidden")).toBe("true")
    // 2 children: Starfield wrapper + Moon
    expect(root.children).toHaveLength(2)
  })

  it("renders a sun + clouds during the day", () => {
    mockedGetCurrentSky.mockReturnValue("day")
    const { container } = render(<Sky />)
    const root = container.firstElementChild as HTMLElement
    expect(root.children).toHaveLength(2)
  })

  it("renders a sun + clouds at dawn", () => {
    mockedGetCurrentSky.mockReturnValue("dawn")
    const { container } = render(<Sky />)
    const root = container.firstElementChild as HTMLElement
    expect(root.children).toHaveLength(2)
  })

  it("renders a sun + clouds at dusk", () => {
    mockedGetCurrentSky.mockReturnValue("dusk")
    const { container } = render(<Sky />)
    const root = container.firstElementChild as HTMLElement
    expect(root.children).toHaveLength(2)
  })

  it("coalesces back-to-back cloud-parallax scrolls into a single `requestAnimationFrame`", () => {
    mockedGetCurrentSky.mockReturnValue("day")
    const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1)
    render(<Sky />)
    window.dispatchEvent(new Event("scroll"))
    window.dispatchEvent(new Event("scroll"))
    window.dispatchEvent(new Event("scroll"))
    expect(rafSpy).toHaveBeenCalledTimes(1)
    rafSpy.mockRestore()
  })
})
