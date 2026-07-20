import { describe, expect, it } from "vitest"

import { applyResumePatch, isResumePatch } from "./patch"

const base: Data = {
  name: "CJ Rivas",
  contact: [{ label: "Email", value: "cj@example.com" }],
  title: "Software Engineer",
  summary: "Generalist engineer.",
  technical_skills: ["React", "TypeScript", "Node"],
  skill_descriptions: ["UI library", "Typed JS", "JS runtime"],
  soft_skills: ["Communication"],
  work_experience: [
    {
      role: "Senior Dev",
      company: "Acme",
      period: "2020–2024",
      achievements: ["Built the thing", "Shipped the other thing"],
    },
    {
      role: "Dev",
      company: "Globex",
      period: "2016–2020",
      achievements: ["Maintained legacy app"],
    },
  ],
  awards: [{ name: "Best Dev", organization: "Acme", year: 2022 }],
  languages: [{ name: "English", proficiency: "Native" }],
  education: [{ program: "CS", institution: "School" }],
  showcase: [
    {
      name: "Demo",
      domain: "demo.dev",
      url: "https://demo.dev",
      role: "Author",
      period: "2023",
      description: "A demo",
      image: "demo.png",
      tags: ["react"],
    },
  ],
}

const patch: ResumePatch = {
  title: "Senior Frontend Engineer",
  summary: "Frontend specialist.",
  technical_skills: ["TypeScript", "React"],
  work_experience: [{ index: 0, achievements: ["Rephrased impact bullet"] }],
  suggestedName: "Senior Frontend Engineer @ Achievers",
}

describe("applyResumePatch", () => {
  it("overrides title, summary, and skills from the patch", () => {
    const merged = applyResumePatch(base, patch)
    expect(merged.title).toBe("Senior Frontend Engineer")
    expect(merged.summary).toBe("Frontend specialist.")
    expect(merged.technical_skills).toEqual(["TypeScript", "React"])
  })

  it("derives skill_descriptions from the base by skill name", () => {
    const merged = applyResumePatch(base, patch)
    expect(merged.skill_descriptions).toEqual(["Typed JS", "UI library"])
  })

  it("uses an empty description for skills missing from the base", () => {
    const merged = applyResumePatch(base, {
      ...patch,
      technical_skills: ["React", "Quantum Computing"],
    })
    expect(merged.skill_descriptions).toEqual(["UI library", ""])
  })

  it("replaces achievements only for patched indices", () => {
    const merged = applyResumePatch(base, patch)
    expect(merged.work_experience[0].achievements).toEqual([
      "Rephrased impact bullet",
    ])
    expect(merged.work_experience[1].achievements).toEqual([
      "Maintained legacy app",
    ])
  })

  it("keeps role, company, and period from the base entry", () => {
    const merged = applyResumePatch(base, patch)
    expect(merged.work_experience[0]).toMatchObject({
      role: "Senior Dev",
      company: "Acme",
      period: "2020–2024",
    })
  })

  it("ignores out-of-range experience indices", () => {
    const merged = applyResumePatch(base, {
      ...patch,
      work_experience: [
        { index: -1, achievements: ["nope"] },
        { index: 99, achievements: ["nope"] },
      ],
    })
    expect(merged.work_experience).toEqual(base.work_experience)
  })

  it("passes untouched sections through from the base", () => {
    const merged = applyResumePatch(base, patch)
    expect(merged.name).toBe(base.name)
    expect(merged.contact).toEqual(base.contact)
    expect(merged.awards).toEqual(base.awards)
    expect(merged.languages).toEqual(base.languages)
    expect(merged.education).toEqual(base.education)
    expect(merged.showcase).toEqual(base.showcase)
  })

  it("does not mutate the base resume", () => {
    const snapshot = JSON.parse(JSON.stringify(base))
    applyResumePatch(base, patch)
    expect(base).toEqual(snapshot)
  })

  it("lets a later duplicate index win", () => {
    const merged = applyResumePatch(base, {
      ...patch,
      work_experience: [
        { index: 0, achievements: ["first"] },
        { index: 0, achievements: ["second"] },
      ],
    })
    expect(merged.work_experience[0].achievements).toEqual(["second"])
  })
})

describe("isResumePatch", () => {
  it("accepts a valid patch", () => {
    expect(isResumePatch(patch)).toBe(true)
  })

  it("accepts an empty work_experience list", () => {
    expect(isResumePatch({ ...patch, work_experience: [] })).toBe(true)
  })

  it("rejects non-objects", () => {
    expect(isResumePatch(null)).toBe(false)
    expect(isResumePatch(undefined)).toBe(false)
    expect(isResumePatch("patch")).toBe(false)
    expect(isResumePatch(42)).toBe(false)
    expect(isResumePatch([])).toBe(false)
  })

  it("rejects missing or mistyped top-level fields", () => {
    expect(isResumePatch({ ...patch, title: 1 })).toBe(false)
    expect(isResumePatch({ ...patch, summary: undefined })).toBe(false)
    expect(isResumePatch({ ...patch, technical_skills: "React" })).toBe(false)
    expect(isResumePatch({ ...patch, technical_skills: ["React", 2] })).toBe(
      false
    )
    expect(isResumePatch({ ...patch, work_experience: {} })).toBe(false)
    expect(isResumePatch({ ...patch, suggestedName: null })).toBe(false)
  })

  it("rejects malformed work_experience entries", () => {
    expect(
      isResumePatch({
        ...patch,
        work_experience: [{ index: "0", achievements: ["x"] }],
      })
    ).toBe(false)
    expect(
      isResumePatch({
        ...patch,
        work_experience: [{ index: 0, achievements: [1] }],
      })
    ).toBe(false)
    expect(isResumePatch({ ...patch, work_experience: [{ index: 0 }] })).toBe(
      false
    )
    expect(isResumePatch({ ...patch, work_experience: [null] })).toBe(false)
  })
})
