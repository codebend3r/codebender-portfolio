import { describe, expect, it } from "vitest"

import {
  contactHref,
  contactIconKind,
  isDirectContactKind,
  isEmail,
  isLocationEntry,
  isPhone,
  isSocialContactKind,
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

describe("contactIconKind", () => {
  it("returns github for a github.com URL", () => {
    expect(contactIconKind("https://github.com/codebend3r")).toBe("github")
  })

  it("returns linkedin for a linkedin.com URL", () => {
    expect(contactIconKind("https://linkedin.com/in/chesterrivas/")).toBe(
      "linkedin"
    )
  })

  it("returns site for any other URL", () => {
    expect(contactIconKind("https://codebender-portoflio.netlify.app/")).toBe(
      "site"
    )
  })

  it("returns email for an email address", () => {
    expect(contactIconKind("cj@example.com")).toBe("email")
  })

  it("returns phone for a phone number", () => {
    expect(contactIconKind("416-555-0123")).toBe("phone")
  })

  it("returns null for plain text like a location", () => {
    expect(contactIconKind("Toronto, ON")).toBeNull()
  })
})

describe("isDirectContactKind", () => {
  it.each(["email", "phone"] as const)("returns true for %s", (kind) => {
    expect(isDirectContactKind(kind)).toBe(true)
  })

  it.each(["github", "linkedin", "site", null] as const)(
    "returns false for %s",
    (kind) => {
      expect(isDirectContactKind(kind)).toBe(false)
    }
  )
})

describe("isSocialContactKind", () => {
  it.each(["github", "linkedin", "site"] as const)(
    "returns true for %s",
    (kind) => {
      expect(isSocialContactKind(kind)).toBe(true)
    }
  )

  it.each(["email", "phone", null] as const)("returns false for %s", (kind) => {
    expect(isSocialContactKind(kind)).toBe(false)
  })
})

describe("isLocationEntry", () => {
  it("returns true for a Location label", () => {
    expect(isLocationEntry({ label: "Location", value: "Mississauga" })).toBe(
      true
    )
  })

  it("is case-insensitive", () => {
    expect(isLocationEntry({ label: "location", value: "London" })).toBe(true)
  })

  it("returns false for other labels", () => {
    expect(
      isLocationEntry({ label: "GitHub", value: "https://github.com" })
    ).toBe(false)
  })
})
