import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import {
  SoftSkills,
  addSoftSkill,
  removeSoftSkill,
} from "@components/SoftSkills"

import resume from "@data/resume.json"

import { useStore } from "@state/useStore"

beforeEach(() => {
  useStore.getState().loadData(structuredClone(resume) as Data)
})

describe("SoftSkills", () => {
  it("renders inside a Soft Skills section", () => {
    render(<SoftSkills />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Soft Skills" })
    ).toBeInTheDocument()
  })

  it("renders one pill per soft skill", () => {
    render(<SoftSkills />)
    expect(screen.getAllByRole("listitem")).toHaveLength(
      resume.soft_skills.length
    )
    resume.soft_skills.forEach((skill) => {
      expect(screen.getByText(skill)).toBeInTheDocument()
    })
  })

  it("renders a numbered eyebrow chip when index and eyebrow are passed", () => {
    render(<SoftSkills index={2} eyebrow="Soft Skills" />)
    expect(screen.getByText("02 · Soft Skills")).toBeInTheDocument()
  })
})

describe("soft skill editing", () => {
  it("addSoftSkill appends a skill", () => {
    addSoftSkill()
    const state = useStore.getState()
    expect(state.soft_skills).toHaveLength(resume.soft_skills.length + 1)
    expect(state.soft_skills[state.soft_skills.length - 1]).toBe(
      "New soft skill"
    )
  })

  it("removeSoftSkill removes the skill at the index", () => {
    removeSoftSkill(0)
    const state = useStore.getState()
    expect(state.soft_skills).toHaveLength(resume.soft_skills.length - 1)
    expect(state.soft_skills[0]).toBe(resume.soft_skills[1])
  })
})
