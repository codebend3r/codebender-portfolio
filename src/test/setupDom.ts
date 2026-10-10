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

// jsdom doesn't implement <dialog>'s show()/showModal()/close(); the
// recruiter chat panel (src/chat/ChatPanel.tsx) is a real <dialog>, so give
// it a minimal, attribute-toggling stand-in. `:modal` matching stays false
// (jsdom's selector engine doesn't support it either), which is fine: the
// component only consults it for a secondary resize-while-open refinement.
if (typeof HTMLDialogElement.prototype.showModal !== "function") {
  HTMLDialogElement.prototype.show = function (this: HTMLDialogElement) {
    this.setAttribute("open", "")
  }
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "")
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open")
    this.dispatchEvent(new Event("close"))
  }
}

// jsdom has no scroll APIs at all; harmless no-ops so components that call
// them (smooth-scroll to a resume section, auto-scroll a message log) don't
// throw in tests.
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = vi.fn()
}
if (typeof Element.prototype.scrollTo !== "function") {
  Element.prototype.scrollTo = vi.fn()
}

afterEach(() => {
  cleanup()
})
