import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TechnicalSkills } from "@components/TechnicalSkills"

import resume from "@data/resume.json"

describe("TechnicalSkills", () => {
  it("renders inside a Technical Skills section", () => {
    render(<TechnicalSkills />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Technical Skills" })
    ).toBeInTheDocument()
  })

  it("renders one list item per skill", () => {
    render(<TechnicalSkills />)
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(resume.technical_skills.length)
  })

  it("renders each skill label", () => {
    render(<TechnicalSkills />)
    for (const skill of resume.technical_skills) {
      expect(screen.getByText(skill)).toBeInTheDocument()
    }
  })
})
