import { describe, expect, it } from "vitest"

import { isHTMLElement } from "@utils/dom-utils"

describe("isHTMLElement", () => {
  it("returns true for a real HTMLElement", () => {
    expect(isHTMLElement(document.createElement("div"))).toBe(true)
  })

  it("returns true for a subclass like HTMLButtonElement", () => {
    expect(isHTMLElement(document.createElement("button"))).toBe(true)
  })

  it("returns false for non-element values", () => {
    expect(isHTMLElement(null)).toBe(false)
    expect(isHTMLElement(undefined)).toBe(false)
    expect(isHTMLElement("div")).toBe(false)
    expect(isHTMLElement({})).toBe(false)
    expect(isHTMLElement(42)).toBe(false)
  })

  it("returns false for a Text node", () => {
    expect(isHTMLElement(document.createTextNode("hi"))).toBe(false)
  })
})
