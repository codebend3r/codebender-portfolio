import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Summary } from "@components/Summary"

import resume from "@data/resume.json"

describe("Summary", () => {
  it("renders inside a Summary section", () => {
    render(<Summary />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Summary" })
    ).toBeInTheDocument()
  })

  it("renders the summary text from the store", () => {
    render(<Summary />)
    expect(screen.getByText(resume.summary)).toBeInTheDocument()
  })
})
