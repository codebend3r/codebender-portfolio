import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TechnicalSkills } from "@components/TechnicalSkills"

import resume from "@data/resume.json"

import { EditProvider } from "@edit/EditContext"

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

  it("renders a numbered eyebrow chip when index and eyebrow are passed", () => {
    render(<TechnicalSkills index={1} eyebrow="Stack" />)
    expect(screen.getByText("01 · Stack")).toBeInTheDocument()
  })

  it("does not render the hover-text editor when not editing", () => {
    render(<TechnicalSkills />)
    expect(screen.queryByText("Chip hover text")).not.toBeInTheDocument()
  })

  it("renders an editable hover-text field per skill when editing", () => {
    render(
      <EditProvider editing markDirty={() => {}}>
        <TechnicalSkills />
      </EditProvider>
    )
    expect(screen.getByText("Chip hover text")).toBeInTheDocument()
    const reactIndex = resume.technical_skills.indexOf("React")
    const field = screen.getByRole("textbox", {
      name: "Hover text for React",
    })
    expect(field).toHaveValue(resume.skill_descriptions[reactIndex])
  })
})
