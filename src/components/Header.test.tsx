import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Header } from "@components/Header"

import resume from "@data/resume.json"

describe("Header", () => {
  it("renders the name as the page heading", () => {
    render(<Header />)
    expect(
      screen.getByRole("heading", { level: 1, name: resume.name })
    ).toBeInTheDocument()
  })

  it("renders the title/subtitle", () => {
    render(<Header />)
    expect(screen.getByText(resume.title)).toBeInTheDocument()
  })

  it("renders an email mailto: link", () => {
    render(<Header />)
    const link = screen.getByRole("link", { name: resume.contact.email })
    expect(link).toHaveAttribute("href", `mailto:${resume.contact.email}`)
  })

  it("renders a phone tel: link", () => {
    render(<Header />)
    const link = screen.getByRole("link", { name: resume.contact.phone })
    expect(link).toHaveAttribute("href", `tel:${resume.contact.phone}`)
  })

  it("renders the location text", () => {
    render(<Header />)
    expect(screen.getByText(resume.contact.location)).toBeInTheDocument()
  })

  it("renders a GitHub link that opens in a new tab safely", () => {
    render(<Header />)
    const link = screen.getByRole("link", { name: "GitHub" })
    expect(link).toHaveAttribute("href", resume.contact.github)
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("renders the logo with alt text", () => {
    render(<Header />)
    expect(screen.getByAltText("Logo")).toBeInTheDocument()
  })
})
