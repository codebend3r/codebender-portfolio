import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { applySky, getCurrentSky } from "@sky"

function setSearch(query: string) {
  window.history.replaceState({}, "", query ? `/?${query}` : "/")
}

describe("getCurrentSky", () => {
  beforeEach(() => {
    setSearch("")
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    setSearch("")
  })

  it("returns the override from the ?sky= query when valid", () => {
    setSearch("sky=day")
    expect(getCurrentSky()).toBe("day")
  })

  it("ignores an unknown ?sky= override", () => {
    setSearch("sky=banana")
    vi.setSystemTime(new Date(2026, 0, 1, 10))
    expect(getCurrentSky()).toBe("day")
  })

  it.each([
    [5, "dawn"],
    [6, "dawn"],
    [7, "dawn"],
    [8, "day"],
    [12, "day"],
    [16, "day"],
    [17, "dusk"],
    [19, "dusk"],
    [20, "night"],
    [23, "night"],
    [0, "night"],
    [4, "night"],
  ])("maps hour %i to %s", (hour, expected) => {
    vi.setSystemTime(new Date(2026, 0, 1, hour))
    expect(getCurrentSky()).toBe(expected)
  })
})

describe("applySky", () => {
  beforeEach(() => {
    setSearch("")
    vi.useFakeTimers()
    document.documentElement.removeAttribute("style")
  })

  afterEach(() => {
    vi.useRealTimers()
    setSearch("")
    document.documentElement.removeAttribute("style")
  })

  it("returns the resolved sky", () => {
    setSearch("sky=night")
    expect(applySky()).toBe("night")
  })

  it("writes palette CSS variables on the root element", () => {
    setSearch("sky=day")
    applySky()
    const root = document.documentElement
    expect(root.style.getPropertyValue("--bg")).toBe("#0a1828")
    expect(root.style.getPropertyValue("--glow1")).toContain("radial-gradient")
    expect(root.style.getPropertyValue("--glow2")).toContain("radial-gradient")
  })

  it("applies a different palette for night", () => {
    setSearch("sky=night")
    applySky()
    expect(document.documentElement.style.getPropertyValue("--bg")).toBe(
      "#0b0e14"
    )
  })
})
