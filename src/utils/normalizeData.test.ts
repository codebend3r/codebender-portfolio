import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { normalizeData } from "@utils/normalizeData"

describe("normalizeData", () => {
  it("returns data with an array contact untouched", () => {
    const data = structuredClone(resume) as Data
    expect(normalizeData(data)).toEqual(data)
  })

  it("converts a legacy object contact into ordered entries", () => {
    const data = {
      ...(structuredClone(resume) as Data),
      contact: {
        email: "a@x.com",
        github: "https://github.com/a",
      } as unknown as ContactEntry[],
    }
    expect(normalizeData(data).contact).toEqual([
      { label: "Email", value: "a@x.com" },
      { label: "GitHub", value: "https://github.com/a" },
    ])
  })
})

describe("normalizeData soft-skills backfill", () => {
  it("backfills soft skills missing from older variations", () => {
    const data = structuredClone(resume) as Data
    Reflect.deleteProperty(data, "soft_skills")
    expect(normalizeData(data).soft_skills).toEqual(resume.soft_skills)
  })

  it("never overwrites soft skills already set on the variation", () => {
    const data = structuredClone(resume) as Data
    data.soft_skills = ["Rubber Duck Debugging"]
    expect(normalizeData(data).soft_skills).toEqual(["Rubber Duck Debugging"])
  })
})

describe("normalizeData employment backfill", () => {
  const stripped = () => {
    const data = structuredClone(resume) as Data
    data.work_experience = data.work_experience.map(
      ({ role, company, period, achievements }) => ({
        role,
        company,
        period,
        achievements,
      })
    )
    return data
  }

  it("backfills schedule and arrangement from the base resume stint", () => {
    const result = normalizeData(stripped())
    expect(result.work_experience[0].schedule).toBe("full-time")
    expect(result.work_experience[0].arrangement).toBe("contract")
    expect(result.work_experience[1].schedule).toBe("part-time")
    expect(result.work_experience[1].arrangement).toBe("contract")
  })

  it("leaves stints unknown to the base resume unset", () => {
    const data = stripped()
    data.work_experience[0] = {
      ...data.work_experience[0],
      company: "Somewhere Else Inc.",
    }
    const result = normalizeData(data)
    expect(result.work_experience[0].schedule).toBeUndefined()
    expect(result.work_experience[0].arrangement).toBeUndefined()
  })

  it("never overwrites values already set on the variation", () => {
    const data = structuredClone(resume) as Data
    data.work_experience[0] = {
      ...data.work_experience[0],
      schedule: "part-time",
      arrangement: "permanent",
    }
    const result = normalizeData(data)
    expect(result.work_experience[0].schedule).toBe("part-time")
    expect(result.work_experience[0].arrangement).toBe("permanent")
  })
})
