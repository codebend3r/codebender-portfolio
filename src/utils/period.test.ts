// @vitest-environment node

import { describe, expect, it } from "vitest"

import { formatPeriod, parsePeriod } from "@utils/period"

describe("parsePeriod", () => {
  it("parses a standard period string", () => {
    const result = parsePeriod({ period: "09/2024 - 05/2026" })
    // 09/2024 = 2024*12 + 8 = 24296; 05/2026 = 2026*12 + 4 = 24316
    expect(result).toEqual({ start: 24296, end: 24316 })
  })

  it("parses a period ending with Present", () => {
    const now = new Date(2026, 6, 1) // July 2026 (month 6)
    const result = parsePeriod({
      period: "11/2023 - Present",
      now,
    })
    // Nov 2023 = 2023*12 + 10 = 24286; July 2026 = 2026*12 + 6 = 24318
    expect(result).toEqual({ start: 24286, end: 24318 })
  })

  it("counts a same-month period as valid", () => {
    const result = parsePeriod({ period: "05/2020 - 05/2020" })
    // 05/2020 = 2020*12 + 4 = 24244
    expect(result).toEqual({ start: 24244, end: 24244 })
  })

  it("handles periods with various whitespace", () => {
    const result = parsePeriod({ period: "01/2011  -  01/2012" })
    // 01/2011 = 2011*12 + 0 = 24132; 01/2012 = 2012*12 + 0 = 24144
    expect(result).toEqual({ start: 24132, end: 24144 })
  })

  it("is case-insensitive for Present", () => {
    const now = new Date(2026, 0, 1) // Jan 2026 (month 0)
    const result = parsePeriod({
      period: "01/2025 - present",
      now,
    })
    // 01/2025 = 2025*12 + 0 = 24300; Jan 2026 = 2026*12 + 0 = 24312
    expect(result?.start).toBe(24300) // Jan 2025
    expect(result?.end).toBe(24312) // Jan 2026
  })

  it("returns null for unparseable input", () => {
    expect(parsePeriod({ period: "gibberish" })).toBeNull()
    expect(parsePeriod({ period: "2019 - 2021" })).toBeNull()
    expect(parsePeriod({ period: "01/2020" })).toBeNull()
  })

  it("returns null for backwards periods", () => {
    expect(parsePeriod({ period: "05/2026 - 05/2025" })).toBeNull()
  })

  it("defaults to current date when now is not provided", () => {
    // Just verify it doesn't throw and returns a result for "Present"
    const result = parsePeriod({ period: "01/2020 - Present" })
    expect(result).not.toBeNull()
    // 01/2020 = 2020*12 + 0 = 24240
    expect(result?.start).toBe(24240) // Jan 2020
    expect(result?.end).toBeGreaterThan(24240)
  })
})

describe("formatPeriod", () => {
  it("spells out both ends as short month and year", () => {
    expect(formatPeriod({ period: "02/2012 - 03/2014" })).toBe(
      "Feb 2012 – Mar 2014"
    )
  })

  it("keeps an open-ended period as Present", () => {
    expect(formatPeriod({ period: "01/2011 - Present" })).toBe(
      "Jan 2011 – Present"
    )
  })

  it("matches Present case-insensitively", () => {
    expect(formatPeriod({ period: "12/2020 - present" })).toBe(
      "Dec 2020 – Present"
    )
  })

  it("returns null for unparseable periods", () => {
    expect(formatPeriod({ period: "2019 to 2021" })).toBeNull()
  })
})
