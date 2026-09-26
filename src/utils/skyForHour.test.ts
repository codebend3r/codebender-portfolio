import { describe, expect, it } from "vitest"

import { isSky, skyForHour } from "@utils/skyForHour"

describe("skyForHour", () => {
  it.each([
    [0, "night"],
    [4, "night"],
    [5, "dawn"],
    [7, "dawn"],
    [8, "day"],
    [12, "day"],
    [16, "day"],
    [17, "dusk"],
    [19, "dusk"],
    [20, "night"],
    [23, "night"],
  ] as const)("maps hour %i to %s", (hour, expected) => {
    expect(skyForHour(hour)).toBe(expected)
  })
})

describe("isSky", () => {
  it("accepts the sky literals", () => {
    expect(isSky("night")).toBe(true)
    expect(isSky("dawn")).toBe(true)
    expect(isSky("day")).toBe(true)
    expect(isSky("dusk")).toBe(true)
  })

  it("rejects other values", () => {
    expect(isSky("noon")).toBe(false)
    expect(isSky("")).toBe(false)
    expect(isSky(null)).toBe(false)
    expect(isSky(4)).toBe(false)
  })
})
