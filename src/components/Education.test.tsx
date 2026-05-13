import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Education } from "@components/Education"

import resume from "@data/resume.json"

describe("Education", () => {
  it("renders inside an Education section", () => {
    render(<Education />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Education" })
    ).toBeInTheDocument()
  })

  it("renders one list item per education entry", () => {
    render(<Education />)
    expect(screen.getAllByRole("listitem")).toHaveLength(
      resume.education.length
    )
  })

  it("renders program and institution for each entry", () => {
    render(<Education />)
    for (const entry of resume.education as Education[]) {
      const item = screen.getByText(entry.program).closest("li")!
      expect(item.textContent).toContain(entry.institution)
      if (entry.details) {
        expect(item.textContent).toContain(entry.details)
      }
    }
  })
})
