import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { firstError, isData, validateData } from "@utils/isData"

const base = () => structuredClone(resume) as Data

describe("isData", () => {
  it("accepts the canonical resume", () => {
    expect(isData(base())).toBe(true)
    expect(firstError(base())).toBeNull()
  })

  it("rejects non-objects", () => {
    expect(isData(null)).toBe(false)
    expect(isData([])).toBe(false)
    expect(isData("{}")).toBe(false)
    expect(isData(42)).toBe(false)
  })

  it("requires the top-level string fields", () => {
    const fields = ["name", "title", "summary"]
    fields.forEach((key) => {
      const data = base()
      Reflect.deleteProperty(data, key)
      expect(isData(data)).toBe(false)
      expect(firstError(data)).toContain(key)
    })
  })

  it("requires the string-array fields", () => {
    const fields = ["technical_skills", "skill_descriptions", "soft_skills"]
    fields.forEach((key) => {
      const data = base()
      Reflect.set(data, key, ["ok", 3])
      expect(isData(data)).toBe(false)
      expect(firstError(data)).toContain(key)
    })
  })

  it("ignores unknown extra keys", () => {
    const data = { ...base(), unexpected: "field" }
    expect(isData(data)).toBe(true)
  })
})

describe("isData nested items", () => {
  it("rejects a malformed contact entry", () => {
    const data = base()
    data.contact = [{ label: "Email", value: 5 } as unknown as ContactEntry]
    expect(firstError(data)).toBe('"contact[0]" value must be a string')
  })

  it("rejects an award with a non-number year", () => {
    const data = base()
    data.awards[0] = { ...data.awards[0], year: "2020" as unknown as number }
    expect(firstError(data)).toBe('"awards[0]" year must be a number')
  })

  it("rejects an experience missing achievements", () => {
    const data = base()
    Reflect.deleteProperty(data.work_experience[0], "achievements")
    expect(firstError(data)).toContain("achievements")
  })

  it("accepts a valid optional employment value but rejects a bad one", () => {
    const good = base()
    good.work_experience[0].schedule = "part-time"
    expect(isData(good)).toBe(true)

    const bad = base()
    Reflect.set(bad.work_experience[0], "schedule", "weekends")
    expect(firstError(bad)).toContain("schedule")
  })

  it("allows an absent optional education detail but rejects a non-string", () => {
    const good = base()
    Reflect.deleteProperty(good.education[0], "details")
    expect(isData(good)).toBe(true)

    const bad = base()
    Reflect.set(bad.education[0], "details", 7)
    expect(firstError(bad)).toContain("details")
  })

  it("rejects a showcase entry with non-string tags", () => {
    const data = base()
    data.showcase[0] = {
      ...data.showcase[0],
      tags: ["react", 3] as unknown as string[],
    }
    expect(firstError(data)).toBe(
      '"showcase[0]" tags must be an array of strings'
    )
  })
})

describe("validateData", () => {
  it("returns the narrowed data on success", () => {
    const result = validateData(base())
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.name).toBe(resume.name)
  })

  it("returns the first error message on failure", () => {
    const result = validateData({ name: "x" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain("title")
  })
})
