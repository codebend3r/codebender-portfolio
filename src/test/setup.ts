import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import "@testing-library/jest-dom/vitest"

class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)

// jsdom has no ResizeObserver; dnd-kit's measuring code requires one.
if (typeof globalThis.ResizeObserver === "undefined") {
  class MockResizeObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }
  vi.stubGlobal("ResizeObserver", MockResizeObserver)
}

afterEach(() => {
  cleanup()
})
