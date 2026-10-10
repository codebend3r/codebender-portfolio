import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { diffResume } from "@utils/resumeDiff"

const base = (): Data => structuredClone(resume) as Data

describe("diffResume", () => {
  it("flags nothing when the generated resume equals the base", () => {
    const diff = diffResume({ base: base(), generated: base() })
    expect(diff.title).toBe(false)
    expect(diff.summary).toBe(false)
    expect(diff.newSkills.size).toBe(0)
    expect(diff.changedAchievements.flat().every((c) => !c)).toBe(true)
  })

  it("flags a rewritten title and summary", () => {
    const generated = { ...base(), title: "New Title", summary: "New summary" }
    const diff = diffResume({ base: base(), generated })
    expect(diff.title).toBe(true)
    expect(diff.summary).toBe(true)
  })

  it("flags skills that are not in the base list", () => {
    const generated = base()
    generated.technical_skills = ["Turborepo", ...generated.technical_skills]
    const diff = diffResume({ base: base(), generated })
    expect(diff.newSkills).toEqual(new Set(["Turborepo"]))
  })

  it("does not flag reselected or reordered base skills", () => {
    const generated = base()
    generated.technical_skills = [...generated.technical_skills]
      .reverse()
      .slice(0, 4)
    const diff = diffResume({ base: base(), generated })
    expect(diff.newSkills.size).toBe(0)
  })

  it("flags rewritten achievement bullets by entry and index", () => {
    const generated = base()
    generated.work_experience[1].achievements[2] = "Fabricated new bullet"
    const diff = diffResume({ base: base(), generated })
    expect(diff.changedAchievements[1][2]).toBe(true)
    expect(diff.changedAchievements[1][0]).toBe(false)
    expect(diff.changedAchievements[0].every((c) => !c)).toBe(true)
  })

  it("does not flag bullets reordered within an entry", () => {
    const generated = base()
    generated.work_experience[0].achievements = [
      ...generated.work_experience[0].achievements,
    ].reverse()
    const diff = diffResume({ base: base(), generated })
    expect(diff.changedAchievements[0].every((c) => !c)).toBe(true)
  })

  it("flags every bullet of an entry missing from the base", () => {
    const generated = base()
    generated.work_experience = [
      ...generated.work_experience,
      {
        role: "Extra",
        company: "Extra Co",
        period: "01/2020 - 02/2020",
        achievements: ["a", "b"],
      },
    ]
    const diff = diffResume({ base: base(), generated })
    const extra = diff.changedAchievements[generated.work_experience.length - 1]
    expect(extra).toEqual([true, true])
  })
})
