import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { Education } from "@components/Education"

import resume from "@data/resume.json"

import { useStore } from "@state/useStore"

describe("Education", () => {
  const originalEducation = useStore.getState().education

  afterEach(() => {
    useStore.setState({ education: originalEducation })
  })

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

  it("appends ` — <details>` when the entry has a `details` field", () => {
    useStore.setState({
      education: [
        {
          program: "Test Program",
          institution: "Test Institution",
          details: "Honours Diploma",
        },
      ],
    })
    render(<Education />)
    const item = screen.getByRole("listitem")
    expect(item.textContent).toContain("Honours Diploma")
    expect(item.textContent).toMatch(/Test Institution — Honours Diploma/)
  })

  it("renders a numbered eyebrow chip when index and eyebrow are passed", () => {
    render(<Education index={5} eyebrow="Education" />)
    expect(screen.getByText("05 · Education")).toBeInTheDocument()
  })
})
