import { describe, expect, it } from "vitest"

import { experienceDuration } from "@utils/experienceDuration"

describe("experienceDuration", () => {
  it("formats a span of years and months", () => {
    expect(experienceDuration("09/2024 - 05/2026")).toBe("1 year 9 months")
  })

  it("formats a span of months only", () => {
    expect(experienceDuration("06/2024 - 09/2024")).toBe("4 months")
  })

  it("formats whole years without a month part", () => {
    expect(experienceDuration("01/2020 - 12/2020")).toBe("1 year")
    expect(experienceDuration("01/2018 - 12/2020")).toBe("3 years")
  })

  it("uses singular units", () => {
    expect(experienceDuration("05/2020 - 06/2020")).toBe("2 months")
    expect(experienceDuration("12/2019 - 12/2020")).toBe("1 year 1 month")
  })

  it("counts a same-month period as one month", () => {
    expect(experienceDuration("05/2020 - 05/2020")).toBe("1 month")
  })

  it("counts Present through the current month", () => {
    const now = new Date(2026, 6, 1)
    expect(experienceDuration("11/2023 - Present", now)).toBe(
      "2 years 9 months"
    )
    expect(experienceDuration("07/2026 - Present", now)).toBe("1 month")
  })

  it("returns null for unparseable or future periods", () => {
    expect(experienceDuration("gibberish")).toBeNull()
    expect(experienceDuration("2019 - 2021")).toBeNull()
    expect(experienceDuration("05/2030 - Present", new Date(2026, 6, 1))).toBe(
      null
    )
  })
})
