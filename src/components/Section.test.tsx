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

  it("renders a numbered eyebrow chip when given index and eyebrow", () => {
    render(
      <Section title="Stack" index={1} eyebrow="Stack">
        <p>body</p>
      </Section>
    )
    expect(screen.getByText("01 · Stack")).toBeInTheDocument()
  })

  it("does not render an eyebrow chip when index or eyebrow is missing", () => {
    render(
      <Section title="Summary">
        <p>body</p>
      </Section>
    )
    expect(screen.queryByText(/^\d{2} ·/)).not.toBeInTheDocument()
  })
})
