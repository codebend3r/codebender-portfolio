import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Codebender } from "@components/Codebender"

import { codebenderPillars } from "@data/codebender"
import resume from "@data/resume.json"

const sideProjects = resume.showcase.filter((item) => !!item.repo)

describe("Codebender", () => {
  it("renders the amber section under the #codebender anchor", () => {
    const { container } = render(
      <Codebender index={3} eyebrow="Side Projects · Since 2011" />
    )
    expect(container.querySelector("#codebender")).not.toBeNull()
    expect(
      screen.getByRole("heading", { level: 2, name: "Codebender Inc." })
    ).toBeInTheDocument()
    expect(
      screen.getByText("03 · Side Projects · Since 2011")
    ).toBeInTheDocument()
  })

  it("renders every pillar with its number", () => {
    render(<Codebender index={3} eyebrow="Side Projects" />)
    codebenderPillars.forEach((pillar, i) => {
      expect(screen.getByText(pillar.title)).toBeInTheDocument()
      expect(screen.getByText(pillar.body)).toBeInTheDocument()
      expect(
        screen.getAllByText(String(i + 1).padStart(2, "0")).length
      ).toBeGreaterThanOrEqual(1)
    })
  })

  it("renders one card per side project with live and code links", () => {
    render(<Codebender index={3} eyebrow="Side Projects" />)
    expect(sideProjects.length).toBeGreaterThan(0)
    sideProjects.forEach((item) => {
      const heading = screen.getByRole("heading", { level: 3, name: item.name })
      const card = heading.closest("li")
      expect(card).not.toBeNull()
      const live = within(card!).getByRole("link", { name: "Live ↗" })
      expect(live).toHaveAttribute("href", item.url)
      const code = within(card!).getByRole("link", { name: "Code ↗" })
      expect(code).toHaveAttribute("href", item.repo ?? "")
      expect(
        within(card!).getByRole("img", { name: `${item.name} screenshot` })
      ).toBeInTheDocument()
      expect(within(card!).getByText(item.description)).toBeInTheDocument()
    })
  })

  it("does not render client engagements", () => {
    render(<Codebender index={3} eyebrow="Side Projects" />)
    resume.showcase
      .filter((item) => !item.repo)
      .forEach((item) => {
        expect(
          screen.queryByRole("heading", { level: 3, name: item.name })
        ).not.toBeInTheDocument()
      })
  })
})
