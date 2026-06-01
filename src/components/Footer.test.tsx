import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Footer } from "@components/Footer"

describe("Footer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2027, 5, 1))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the tech credit line", () => {
    render(<Footer />)
    expect(
      screen.getByText("Built with React + Typescript + Vite")
    ).toBeInTheDocument()
  })

  it("renders the current year in the copyright line", () => {
    render(<Footer />)
    expect(screen.getByText(/© 2027\. Codebender Inc\./)).toBeInTheDocument()
  })

  it("uses a <footer> landmark", () => {
    render(<Footer />)
    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
  })

  it("renders the author credit with a github link", () => {
    render(<Footer />)
    const link = screen.getByRole("link", { name: /github\.com\/codebend3r/ })
    expect(link).toHaveAttribute("href", "https://github.com/codebend3r")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.getByText(/CJ Rivas/)).toBeInTheDocument()
  })
})
