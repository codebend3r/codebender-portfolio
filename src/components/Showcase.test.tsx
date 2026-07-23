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
    const links = screen.getAllByRole("link")
    resume.showcase.forEach((item) => {
      const card = links.find((link) => link.getAttribute("href") === item.url)
      expect(card).toBeDefined()
      expect(card).toHaveAttribute("target", "_blank")
      expect(card).toHaveAttribute("rel", expect.stringContaining("noopener"))
    })
  })

  it("renders a hover overlay on every card", () => {
    render(<Showcase />)
    expect(screen.getAllByText("View site")).toHaveLength(
      resume.showcase.length
    )
  })

  it("renders a GitHub overlay link for side projects only", () => {
    render(<Showcase />)
    const showcase: Showcase[] = resume.showcase
    const withRepo = showcase.filter((item) => !!item.repo)
    expect(withRepo.length).toBeGreaterThan(0)
    expect(screen.getAllByText("View code")).toHaveLength(withRepo.length)
    withRepo.forEach((item) => {
      const link = screen.getByRole("link", {
        name: `${item.name} source code on GitHub`,
      })
      expect(link).toHaveAttribute("href", item.repo ?? "")
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"))
    })
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
