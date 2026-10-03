import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isObscured } from "@utils/isObscured"

// jsdom has no layout, so `elementFromPoint` is stubbed to return whichever
// element the test says sits on top at the probed point.
const hitting = (element: Element | null) => {
  document.elementFromPoint = vi.fn(() => element)
}

describe("isObscured", () => {
  let content: HTMLElement
  let header: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = `
      <header style="position: sticky"><span id="brand">CJ</span></header>
      <main><section><figure id="map"><span id="bar"></span></figure></section></main>
    `
    content = document.getElementById("map") ?? document.body
    header = document.getElementById("brand") ?? document.body
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("is clear when the point lands on ordinary page content", () => {
    hitting(document.getElementById("bar"))
    expect(isObscured({ x: 10, y: 10, within: content })).toBe(false)
  })

  it("is obscured when a sticky layer covers the point", () => {
    hitting(header)
    expect(isObscured({ x: 10, y: 10, within: content })).toBe(true)
  })

  it("ignores pinned layers that contain the content itself", () => {
    document.querySelector("section")?.setAttribute("style", "position: fixed")
    hitting(document.getElementById("bar"))
    expect(isObscured({ x: 10, y: 10, within: content })).toBe(false)
  })

  it("is obscured above or below the viewport", () => {
    hitting(document.getElementById("bar"))
    expect(isObscured({ x: 10, y: -1, within: content })).toBe(true)
    expect(
      isObscured({ x: 10, y: window.innerHeight + 1, within: content })
    ).toBe(true)
  })

  it("is obscured when nothing hit-tests at the point", () => {
    hitting(null)
    expect(isObscured({ x: 10, y: 10, within: content })).toBe(true)
  })
})
