import { describe, expect, it } from "vitest"

import { SPRITE_COUNT, SPRITE_GRID, spritePosition } from "@utils/spriteSheet"

describe("sprite sheet constants", () => {
  it("exposes a square grid", () => {
    expect(SPRITE_COUNT).toBe(SPRITE_GRID * SPRITE_GRID)
  })
})

describe("spritePosition", () => {
  it.each([
    [0, "0%", "0%"],
    [1, "50%", "0%"],
    [2, "100%", "0%"],
    [3, "0%", "50%"],
    [4, "50%", "50%"],
    [5, "100%", "50%"],
    [6, "0%", "100%"],
    [7, "50%", "100%"],
    [8, "100%", "100%"],
  ])("maps cell %i to (%s, %s)", (shape, x, y) => {
    expect(spritePosition(shape)).toEqual({ x, y })
  })

  it("wraps indices past the sprite count", () => {
    expect(spritePosition(SPRITE_COUNT)).toEqual(spritePosition(0))
    expect(spritePosition(SPRITE_COUNT + 4)).toEqual(spritePosition(4))
  })

  it("wraps negative indices", () => {
    expect(spritePosition(-1)).toEqual(spritePosition(SPRITE_COUNT - 1))
  })
})
