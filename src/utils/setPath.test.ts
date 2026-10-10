import { describe, expect, it } from "vitest"

import { setPath } from "@utils/setPath"

describe("setPath", () => {
  it("sets a top-level key without mutating the source", () => {
    const src = { name: "A", title: "T" }
    const next = setPath(src, ["name"], "B")
    expect(next).toEqual({ name: "B", title: "T" })
    expect(src.name).toBe("A")
    expect(next).not.toBe(src)
  })

  it("sets a nested object key", () => {
    const src = { contact: { email: "a@x.com", phone: "1" } }
    const next = setPath(src, ["contact", "email"], "b@x.com")
    expect(next.contact.email).toBe("b@x.com")
    expect(next.contact.phone).toBe("1")
    expect(src.contact.email).toBe("a@x.com")
  })

  it("sets a value at a nested array index", () => {
    const src = { work: [{ achievements: ["one", "two"] }] }
    const next = setPath(src, ["work", 0, "achievements", 1], "TWO")
    expect(next.work[0].achievements).toEqual(["one", "TWO"])
    expect(src.work[0].achievements[1]).toBe("two")
    expect(next.work).not.toBe(src.work)
  })

  it("returns the value when path is empty", () => {
    expect(setPath({ a: 1 }, [], { b: 2 })).toEqual({ b: 2 })
  })
})
