import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Languages } from "@components/Languages"

import resume from "@data/resume.json"

describe("Languages", () => {
  it("renders inside a Languages section", () => {
    render(<Languages />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Languages" })
    ).toBeInTheDocument()
  })

  it("renders one list item per language", () => {
    render(<Languages />)
    expect(screen.getAllByRole("listitem")).toHaveLength(
      resume.languages.length
    )
  })

  it("renders name and proficiency for each language", () => {
    render(<Languages />)
    for (const lang of resume.languages) {
      const item = screen.getByText(`${lang.name}:`).closest("li")!
      expect(item.textContent).toContain(lang.proficiency)
    }
  })
})
