// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  barFor,
  careerRange,
  periodBounds,
  popoverPlacement,
  yearTicks,
} from "@utils/careerMap"

describe("periodBounds", () => {
  it("parses a closed period into fractional years", () => {
    expect(periodBounds({ period: "01/2021 - 06/2022" })).toEqual({
      start: 2021,
      end: 2022.5,
    })
  })

  it("treats the end month as inclusive", () => {
    // A single-month stint still gets one month of width.
    expect(periodBounds({ period: "01/2020 - 01/2020" })).toEqual({
      start: 2020,
      end: 2020 + 1 / 12,
    })
  })

  it("resolves Present against the supplied clock", () => {
    expect(
      periodBounds({ period: "01/2011 - Present", now: new Date(2026, 8, 25) })
    ).toEqual({
      start: 2011,
      end: 2026.75,
    })
  })

  it("returns null for unparseable periods", () => {
    expect(periodBounds({ period: "2019 to 2021" })).toBeNull()
    expect(periodBounds({ period: "" })).toBeNull()
  })

  it("returns null for backwards periods", () => {
    expect(periodBounds({ period: "05/2022 - 01/2021" })).toBeNull()
  })
})

describe("careerRange", () => {
  it("spans whole years around the extremes", () => {
    expect(
      careerRange([
        { start: 2008.5, end: 2011.75 },
        { start: 2024.67, end: 2026.42 },
      ])
    ).toEqual({ first: 2008, last: 2027 })
  })

  it("returns null for no bounds", () => {
    expect(careerRange([])).toBeNull()
  })
})

describe("barFor", () => {
  it("maps bounds onto percentages of the range", () => {
    const bar = barFor({
      bounds: { start: 2010, end: 2015 },
      range: { first: 2008, last: 2028 },
    })
    expect(bar.leftPct).toBeCloseTo(10)
    expect(bar.widthPct).toBeCloseTo(25)
  })
})

describe("yearTicks", () => {
  it("emits a tick every step from the range start", () => {
    const ticks = yearTicks({ range: { first: 2008, last: 2027 } })
    expect(ticks.map((tick) => tick.year)).toEqual([
      2008, 2011, 2014, 2017, 2020, 2023, 2026,
    ])
    expect(ticks[0].leftPct).toBe(0)
    expect(ticks[1].leftPct).toBeCloseTo((3 / 19) * 100)
  })

  it("never emits a tick at or past the exclusive end", () => {
    const ticks = yearTicks({ range: { first: 2020, last: 2023 } })
    expect(ticks.map((tick) => tick.year)).toEqual([2020])
  })
})

describe("popoverPlacement", () => {
  const frame = { left: 0, right: 1000 }

  it("centers the popover over the anchor when it fits", () => {
    const placement = popoverPlacement({
      anchor: { left: 400, width: 100 },
      popoverWidth: 200,
      frame,
    })
    // Centered: popover left = 450 - 100 = 350, i.e. 50px before the anchor.
    expect(placement.offset).toBe(-50)
    expect(placement.caret).toBe(100)
  })

  it("pins to the frame's left inset near the start", () => {
    const placement = popoverPlacement({
      anchor: { left: 20, width: 40 },
      popoverWidth: 200,
      frame,
    })
    // Popover left clamps to 8; the caret still points at the anchor's
    // center (40), i.e. 32px into the popover.
    expect(placement.offset).toBe(-12)
    expect(placement.caret).toBe(32)
  })

  it("pins to the frame's right inset near the end", () => {
    const placement = popoverPlacement({
      anchor: { left: 950, width: 40 },
      popoverWidth: 200,
      frame,
    })
    // Popover right clamps to 992, so its left is 792.
    expect(placement.offset).toBe(-158)
    expect(placement.caret).toBe(178)
  })

  it("keeps the caret off the popover's rounded corners", () => {
    const placement = popoverPlacement({
      anchor: { left: 0, width: 4 },
      popoverWidth: 200,
      frame,
    })
    expect(placement.caret).toBe(14)
  })

  it("prefers the left inset when the popover is wider than the frame", () => {
    const placement = popoverPlacement({
      anchor: { left: 100, width: 20 },
      popoverWidth: 300,
      frame: { left: 0, right: 250 },
    })
    expect(placement.offset).toBe(-92)
  })
})
