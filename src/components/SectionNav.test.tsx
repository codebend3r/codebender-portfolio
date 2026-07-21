import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SectionNav } from "@components/SectionNav"

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "technical-skills", label: "Stack" },
  { id: "soft-skills", label: "Soft Skills" },
  { id: "work-experience", label: "Experience" },
  { id: "selected-work", label: "Selected Work" },
  { id: "awards", label: "Recognition" },
  { id: "languages", label: "Languages" },
  { id: "education", label: "Education" },
]

describe("SectionNav", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    )
  })

  it("renders a labelled navigation landmark", () => {
    render(<SectionNav />)
    expect(
      screen.getByRole("navigation", { name: "Section navigation" })
    ).toBeInTheDocument()
  })

  it("renders one anchor per section pointing at its id", () => {
    render(<SectionNav />)
    const nav = screen.getByRole("navigation", { name: "Section navigation" })
    for (const section of SECTIONS) {
      const link = within(nav).getByRole("link", { name: section.label })
      expect(link).toHaveAttribute("href", `#${section.id}`)
    }
  })

  it("smooth-scrolls to the target section on click", () => {
    const target = document.createElement("section")
    target.id = "work-experience"
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView
    document.body.appendChild(target)

    render(<SectionNav />)
    fireEvent.click(screen.getByRole("link", { name: "Experience" }))

    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth", block: "start" })
    )
    document.body.removeChild(target)
  })
})
