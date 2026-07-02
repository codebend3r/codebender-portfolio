import { describe, expect, it } from "vitest"

import {
  contactHref,
  isEmail,
  isPhone,
  isUrl,
  stripProtocol,
} from "@utils/contact"

describe("isUrl", () => {
  it.each([
    "https://github.com/codebend3r",
    "http://example.com",
    "HTTPS://EXAMPLE.COM",
  ])("returns true for %s", (value) => {
    expect(isUrl(value)).toBe(true)
  })

  it.each(["github.com/codebend3r", "cj@example.com", "Toronto, ON", ""])(
    "returns false for %s",
    (value) => {
      expect(isUrl(value)).toBe(false)
    }
  )
})

describe("isEmail", () => {
  it("returns true for an address", () => {
    expect(isEmail("cj.rivas.dev@gmail.com")).toBe(true)
  })

  it("returns false for a URL containing an @", () => {
    expect(isEmail("https://example.com/@user")).toBe(false)
  })

  it("returns false for plain text", () => {
    expect(isEmail("Toronto, ON")).toBe(false)
  })
})

describe("isPhone", () => {
  it.each([
    "416-555-0123",
    "(416) 555-0123",
    "+1 416.555.0123",
    "  4165550123  ",
  ])("returns true for %s", (value) => {
    expect(isPhone(value)).toBe(true)
  })

  it.each(["Toronto, ON", "---", "()+.-", ""])(
    "returns false for %s",
    (value) => {
      expect(isPhone(value)).toBe(false)
    }
  )
})

describe("contactHref", () => {
  it("returns URLs unchanged", () => {
    expect(contactHref("https://github.com/codebend3r")).toBe(
      "https://github.com/codebend3r"
    )
  })

  it("prefixes emails with mailto:", () => {
    expect(contactHref("cj@example.com")).toBe("mailto:cj@example.com")
  })

  it("prefixes phone numbers with tel:", () => {
    expect(contactHref("416-555-0123")).toBe("tel:416-555-0123")
  })

  it("returns null for plain text like a location", () => {
    expect(contactHref("Toronto, ON")).toBeNull()
  })
})

describe("stripProtocol", () => {
  it("removes the https protocol", () => {
    expect(stripProtocol("https://github.com/codebend3r")).toBe(
      "github.com/codebend3r"
    )
  })

  it("removes the http protocol", () => {
    expect(stripProtocol("http://example.com")).toBe("example.com")
  })

  it("removes a trailing slash", () => {
    expect(stripProtocol("https://example.com/")).toBe("example.com")
  })

  it("leaves protocol-less values unchanged", () => {
    expect(stripProtocol("example.com/path")).toBe("example.com/path")
  })
})
