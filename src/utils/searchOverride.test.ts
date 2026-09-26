import { afterEach, describe, expect, it } from "vitest"

import { overrideFromSearch } from "@utils/searchOverride"

const isAB = (value: unknown): value is "a" | "b" =>
  value === "a" || value === "b"

function setSearch(query: string) {
  window.history.replaceState({}, "", query ? `/?${query}` : "/")
}

afterEach(() => {
  setSearch("")
})

describe("overrideFromSearch", () => {
  it("returns a value the guard accepts", () => {
    setSearch("pick=b")
    expect(overrideFromSearch({ key: "pick", guard: isAB })).toBe("b")
  })

  it("returns null for a value the guard rejects", () => {
    setSearch("pick=c")
    expect(overrideFromSearch({ key: "pick", guard: isAB })).toBeNull()
  })

  it("returns null when the key is absent", () => {
    expect(overrideFromSearch({ key: "pick", guard: isAB })).toBeNull()
  })
})
