import { beforeEach, describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { useStore } from "@state/useStore"

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
      linkedin: expect.stringMatching(/^https?:\/\//),
    })
  })
})

describe("useStore edit actions", () => {
  beforeEach(() => {
    useStore.getState().loadData(structuredClone(resume) as Data)
  })

  it("loadData replaces the data fields", () => {
    useStore.getState().loadData({
      ...(structuredClone(resume) as Data),
      name: "Changed Name",
    })
    expect(useStore.getState().name).toBe("Changed Name")
  })

  it("setPath updates a nested value immutably", () => {
    useStore.getState().setPath(["contact", "email"], "new@x.com")
    expect(useStore.getState().contact.email).toBe("new@x.com")
  })

  it("addExperience appends a new experience", () => {
    const before = useStore.getState().work_experience.length
    useStore.getState().addExperience()
    const after = useStore.getState().work_experience
    expect(after.length).toBe(before + 1)
    expect(after[after.length - 1].role).toBe("New Role")
  })

  it("removeExperience drops the experience at index", () => {
    const first = useStore.getState().work_experience[0].company
    useStore.getState().removeExperience(0)
    expect(useStore.getState().work_experience[0].company).not.toBe(first)
  })

  it("addAchievement and removeAchievement mutate the bullet list", () => {
    const before = useStore.getState().work_experience[0].achievements.length
    useStore.getState().addAchievement(0)
    expect(useStore.getState().work_experience[0].achievements.length).toBe(
      before + 1
    )
    useStore.getState().removeAchievement(0, 0)
    expect(useStore.getState().work_experience[0].achievements.length).toBe(
      before
    )
  })

  it("reorder moves an element within a top-level list", () => {
    const [a, b, c] = useStore.getState().technical_skills
    useStore.getState().reorder(["technical_skills"], 0, 2)
    const next = useStore.getState().technical_skills
    expect(next[0]).toBe(b)
    expect(next[1]).toBe(c)
    expect(next[2]).toBe(a)
  })

  it("reorder moves an element within a nested list", () => {
    const [a, b] = useStore.getState().work_experience[0].achievements
    useStore.getState().reorder(["work_experience", 0, "achievements"], 1, 0)
    const next = useStore.getState().work_experience[0].achievements
    expect(next[0]).toBe(b)
    expect(next[1]).toBe(a)
  })

  it("reorder leaves sibling lists untouched", () => {
    const otherBefore = useStore.getState().work_experience[1].achievements
    useStore.getState().reorder(["work_experience", 0, "achievements"], 0, 1)
    expect(useStore.getState().work_experience[1].achievements).toBe(
      otherBefore
    )
  })

  it("reorder no-ops when from equals to", () => {
    const before = useStore.getState().awards
    useStore.getState().reorder(["awards"], 1, 1)
    expect(useStore.getState().awards).toBe(before)
  })

  it("reorder no-ops when an index is out of range", () => {
    const before = useStore.getState().awards
    useStore.getState().reorder(["awards"], 0, before.length)
    useStore.getState().reorder(["awards"], -1, 0)
    expect(useStore.getState().awards).toBe(before)
  })

  it("reorder no-ops when the path is not an array", () => {
    const before = useStore.getState().contact
    useStore.getState().reorder(["contact"], 0, 1)
    expect(useStore.getState().contact).toBe(before)
  })

  it("reorder does not mutate the previous array", () => {
    const before = useStore.getState().languages
    const snapshot = [...before]
    useStore.getState().reorder(["languages"], 0, 1)
    expect(before).toEqual(snapshot)
  })
})
