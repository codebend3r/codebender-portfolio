import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Awards } from "@components/Awards"

import resume from "@data/resume.json"

describe("Awards", () => {
  it("renders inside an Awards section", () => {
    render(<Awards />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Awards" })
    ).toBeInTheDocument()
  })

  it("renders every award with its organization and year", () => {
    render(<Awards />)
    for (const award of resume.awards) {
      expect(screen.getByText(award.name)).toBeInTheDocument()
      const item = screen.getByText(award.name).closest("li")!
      expect(item.textContent).toContain(award.organization)
      expect(item.textContent).toContain(String(award.year))
    }
  })

  it("renders one list item per award", () => {
    render(<Awards />)
    expect(screen.getAllByRole("listitem")).toHaveLength(resume.awards.length)
  })

  it("renders a numbered eyebrow chip when index and eyebrow are passed", () => {
    render(<Awards index={3} eyebrow="Recognition" />)
    expect(screen.getByText("03 · Recognition")).toBeInTheDocument()
  })
})
