import { describe, expect, it } from "vitest"

import { moveItem } from "@utils/moveItem"

describe("moveItem", () => {
  it("moves an item forward", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"])
  })

  it("moves an item backward", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"])
  })

  it("does not mutate the source list", () => {
    const src = ["a", "b", "c"]
    moveItem(src, 0, 2)
    expect(src).toEqual(["a", "b", "c"])
  })

  it("returns null when from and to are equal", () => {
    expect(moveItem(["a", "b"], 1, 1)).toBeNull()
  })

  it.each([
    [-1, 0],
    [0, -1],
    [2, 0],
    [0, 2],
  ])("returns null for out-of-range indices (%i, %i)", (from, to) => {
    expect(moveItem(["a", "b"], from, to)).toBeNull()
  })
})
