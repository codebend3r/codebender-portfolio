import { useStore } from "@state/useStore"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

describe("useStore", () => {
  it("seeds every top-level field from resume.json", () => {
    const state = useStore.getState()
    expect(state.name).toBe(resume.name)
    expect(state.title).toBe(resume.title)
    expect(state.summary).toBe(resume.summary)
    expect(state.contact).toEqual(resume.contact)
    expect(state.technical_skills).toEqual(resume.technical_skills)
    expect(state.work_experience).toEqual(resume.work_experience)
    expect(state.awards).toEqual(resume.awards)
    expect(state.languages).toEqual(resume.languages)
    expect(state.education).toEqual(resume.education)
  })

  it("exposes the same identity for repeat reads (no setters defined)", () => {
    expect(useStore.getState()).toBe(useStore.getState())
  })

  it("contact has the expected shape", () => {
    const { contact } = useStore.getState()
    expect(contact).toMatchObject({
      email: expect.any(String),
      phone: expect.any(String),
      location: expect.any(String),
      github: expect.stringMatching(/^https?:\/\//),
    })
  })
})
