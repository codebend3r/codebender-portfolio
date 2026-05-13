import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Section } from "@components/Section"

describe("Section", () => {
  it("renders the title inside an <h2>", () => {
    render(
      <Section title="Hello">
        <p>body</p>
      </Section>
    )
    const heading = screen.getByRole("heading", { level: 2, name: "Hello" })
    expect(heading).toBeInTheDocument()
  })

  it("renders children", () => {
    render(
      <Section title="X">
        <p data-testid="child">payload</p>
      </Section>
    )
    expect(screen.getByTestId("child")).toHaveTextContent("payload")
  })
})
