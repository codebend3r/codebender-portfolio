import { describe, expect, it } from "vitest"

import { getAtPath } from "@utils/getAtPath"

describe("getAtPath", () => {
  const src = {
    name: "CJ",
    work: [{ achievements: ["one", "two"] }],
    contact: { email: "cj@example.com" },
  }

  it("reads a top-level key", () => {
    expect(getAtPath(src, ["name"])).toBe("CJ")
  })

  it("reads through nested objects and array indices", () => {
    expect(getAtPath(src, ["work", 0, "achievements", 1])).toBe("two")
    expect(getAtPath(src, ["contact", "email"])).toBe("cj@example.com")
  })

  it("returns the object itself for an empty path", () => {
    expect(getAtPath(src, [])).toBe(src)
  })

  it("returns undefined for a missing path", () => {
    expect(getAtPath(src, ["missing"])).toBeUndefined()
    expect(getAtPath(src, ["work", 5, "achievements"])).toBeUndefined()
    expect(getAtPath(src, ["name", "deeper", "still"])).toBeUndefined()
  })

  it("returns undefined when the source is null or undefined", () => {
    expect(getAtPath(null, ["a"])).toBeUndefined()
    expect(getAtPath(undefined, ["a"])).toBeUndefined()
  })
})
