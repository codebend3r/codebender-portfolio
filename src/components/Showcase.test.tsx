import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Showcase } from "@components/Showcase"

import resume from "@data/resume.json"

describe("Showcase", () => {
  it("renders inside a Selected Work section", () => {
    render(<Showcase />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Selected Work" })
    ).toBeInTheDocument()
  })

  it("renders one linked card per showcase item", () => {
    render(<Showcase />)
    for (const item of resume.showcase) {
      const link = screen.getByRole("link", { name: new RegExp(item.name) })
      expect(link).toHaveAttribute("href", item.url)
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"))
    }
  })

  it("renders period, domain, description, and tags for the first card", () => {
    render(<Showcase />)
    const first = resume.showcase[0]
    const card = screen.getByRole("link", { name: new RegExp(first.name) })
    expect(within(card).getByText(first.period)).toBeInTheDocument()
    expect(within(card).getByText(first.domain)).toBeInTheDocument()
    expect(within(card).getByText(first.description)).toBeInTheDocument()
    for (const tag of first.tags) {
      expect(within(card).getByText(tag)).toBeInTheDocument()
    }
  })

  it("gives each screenshot a non-empty alt", () => {
    render(<Showcase />)
    const first = resume.showcase[0]
    expect(
      screen.getByRole("img", { name: `${first.name} website` })
    ).toBeInTheDocument()
  })

  it("renders a numbered eyebrow chip when index and eyebrow are passed", () => {
    render(<Showcase index={3} eyebrow="Selected Work" />)
    expect(screen.getByText("03 · Selected Work")).toBeInTheDocument()
  })
})
