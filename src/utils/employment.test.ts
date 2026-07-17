import { describe, expect, it } from "vitest"

import {
  arrangementOptions,
  formatEmployment,
  isEmploymentArrangement,
  isEmploymentSchedule,
  scheduleOptions,
} from "@utils/employment"

describe("isEmploymentSchedule", () => {
  it("accepts the schedule literals", () => {
    expect(isEmploymentSchedule("full-time")).toBe(true)
    expect(isEmploymentSchedule("part-time")).toBe(true)
  })

  it("rejects other values", () => {
    expect(isEmploymentSchedule("contract")).toBe(false)
    expect(isEmploymentSchedule("")).toBe(false)
    expect(isEmploymentSchedule(undefined)).toBe(false)
    expect(isEmploymentSchedule(7)).toBe(false)
  })
})

describe("isEmploymentArrangement", () => {
  it("accepts the arrangement literals", () => {
    expect(isEmploymentArrangement("contract")).toBe(true)
    expect(isEmploymentArrangement("permanent")).toBe(true)
  })

  it("rejects other values", () => {
    expect(isEmploymentArrangement("full-time")).toBe(false)
    expect(isEmploymentArrangement("")).toBe(false)
    expect(isEmploymentArrangement(null)).toBe(false)
    expect(isEmploymentArrangement({})).toBe(false)
  })
})

describe("formatEmployment", () => {
  it("joins schedule and arrangement with a middle dot", () => {
    expect(
      formatEmployment({ schedule: "full-time", arrangement: "contract" })
    ).toBe("Full-time · Contract")
  })

  it("formats a lone schedule", () => {
    expect(formatEmployment({ schedule: "part-time" })).toBe("Part-time")
  })

  it("formats a lone arrangement", () => {
    expect(formatEmployment({ arrangement: "permanent" })).toBe("Permanent")
  })

  it("returns null when both are absent", () => {
    expect(formatEmployment({})).toBe(null)
  })
})

describe("options", () => {
  it("pairs values with display labels", () => {
    expect(scheduleOptions).toEqual([
      { value: "full-time", label: "Full-time" },
      { value: "part-time", label: "Part-time" },
    ])
    expect(arrangementOptions).toEqual([
      { value: "contract", label: "Contract" },
      { value: "permanent", label: "Permanent" },
    ])
  })
})
