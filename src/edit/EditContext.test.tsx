import { EditProvider, useEditing } from "@edit/EditContext"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

function Probe() {
  const { editing } = useEditing()
  return <span>{editing ? "editing" : "viewing"}</span>
}

describe("EditContext", () => {
  it("defaults to not editing with no provider", () => {
    render(<Probe />)
    expect(screen.getByText("viewing")).toBeInTheDocument()
  })

  it("reflects the provider's editing flag", () => {
    render(
      <EditProvider editing markDirty={() => {}}>
        <Probe />
      </EditProvider>
    )
    expect(screen.getByText("editing")).toBeInTheDocument()
  })
})
