import { describe, expect, it } from "vitest"

import {
  arrangementOptions,
  employmentParts,
  formatEmployment,
  isEmploymentArrangement,
  isEmploymentSchedule,
  narrowEmployment,
  partitionExperience,
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

describe("employmentParts", () => {
  it("returns a keyed, labelled token per set value", () => {
    expect(
      employmentParts({ schedule: "full-time", arrangement: "permanent" })
    ).toEqual([
      { key: "full-time", label: "Full-time" },
      { key: "permanent", label: "Permanent" },
    ])
  })

  it("returns a single token when only one value is set", () => {
    expect(employmentParts({ arrangement: "contract" })).toEqual([
      { key: "contract", label: "Contract" },
    ])
  })

  it("returns an empty list when both are absent", () => {
    expect(employmentParts({})).toEqual([])
  })
})

describe("narrowEmployment", () => {
  const base = {
    role: "Engine Analyst",
    company: "Babbage & Co",
    period: "1842 – 1843",
    achievements: ["Wrote the first algorithm"],
  }

  it("keeps valid values", () => {
    const entry = narrowEmployment({
      ...base,
      schedule: "part-time",
      arrangement: "contract",
    })
    expect(entry.schedule).toBe("part-time")
    expect(entry.arrangement).toBe("contract")
  })

  it("drops invalid values to undefined", () => {
    const entry = narrowEmployment({
      ...base,
      schedule: "sometimes",
      arrangement: 3,
    })
    expect(entry.schedule).toBeUndefined()
    expect(entry.arrangement).toBeUndefined()
  })

  it("keeps a true side_project flag", () => {
    expect(narrowEmployment({ ...base, side_project: true }).side_project).toBe(
      true
    )
  })

  it("drops a non-boolean side_project flag", () => {
    expect(
      narrowEmployment({ ...base, side_project: "yes" }).side_project
    ).toBeUndefined()
  })
})

describe("partitionExperience", () => {
  const entry = (company: string, side_project?: boolean): Experience => ({
    role: "Engineer",
    company,
    period: "2020 - 2021",
    side_project,
    achievements: [],
  })

  it("splits side work from the main career, preserving order", () => {
    const tracks = partitionExperience([
      entry("Practice", true),
      entry("First"),
      entry("Second", false),
    ])
    expect(tracks.main.map((e) => e.company)).toEqual(["First", "Second"])
    expect(tracks.side.map((e) => e.company)).toEqual(["Practice"])
  })

  it("returns empty tracks for no entries", () => {
    expect(partitionExperience([])).toEqual({ main: [], side: [] })
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
