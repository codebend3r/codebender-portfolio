import { afterEach, describe, expect, it, vi } from "vitest"

import { prefersReducedMotion } from "./prefersReducedMotion"

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches, media: "" }))
  )
}

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns true when the media query matches", () => {
    mockMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
  })

  it("returns false when the media query doesn't match", () => {
    mockMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it("returns false when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
})
