import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Showcase } from "@components/Showcase"

import resume from "@data/resume.json"

// The public showcase renders client engagements only; side projects
// (entries with a repo) belong to the Codebender section.
const clientWork = resume.showcase.filter((item) => !item.repo)
const sideProjects = resume.showcase.filter((item) => !!item.repo)

describe("Showcase", () => {
  it("renders inside a Selected Work section", () => {
    render(<Showcase />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Selected Work" })
    ).toBeInTheDocument()
  })

  it("renders one linked card per client engagement", () => {
    render(<Showcase />)
    expect(clientWork.length).toBeGreaterThan(0)
    clientWork.forEach((item) => {
      const card = screen.getByRole("link", {
        name: `${item.name} — live site`,
      })
      expect(card).toHaveAttribute("href", item.url)
      expect(card).toHaveAttribute("target", "_blank")
      expect(card).toHaveAttribute("rel", expect.stringContaining("noopener"))
    })
  })

  it("does not render side projects", () => {
    render(<Showcase />)
    expect(sideProjects.length).toBeGreaterThan(0)
    sideProjects.forEach((item) => {
      expect(
        screen.queryByRole("heading", { level: 3, name: item.name })
      ).not.toBeInTheDocument()
    })
  })

  it("renders name, period, role, and description for the first card", () => {
    render(<Showcase />)
    const first = clientWork[0]
    const heading = screen.getByRole("heading", { level: 3, name: first.name })
    const card = heading.closest("li")
    expect(card).not.toBeNull()
    expect(within(card!).getByText(first.period)).toBeInTheDocument()
    expect(within(card!).getByText(first.role)).toBeInTheDocument()
    expect(within(card!).getByText(first.description)).toBeInTheDocument()
  })

  it("gives each screenshot a non-empty alt", () => {
    render(<Showcase />)
    clientWork.forEach((item) => {
      expect(
        screen.getByRole("img", { name: `${item.name} screenshot` })
      ).toBeInTheDocument()
    })
  })

  it("renders a numbered eyebrow chip when index and eyebrow are passed", () => {
    render(<Showcase index={4} eyebrow="Selected Client Work" />)
    expect(screen.getByText("04 · Selected Client Work")).toBeInTheDocument()
  })
})
