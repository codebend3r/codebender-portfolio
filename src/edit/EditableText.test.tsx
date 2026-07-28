import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { EditableText } from "@edit/EditableText"
import { EditProvider } from "@edit/EditContext"

import { useStore } from "@state/useStore"

beforeEach(() => {
  useStore.getState().loadData(structuredClone(resume) as Data)
})

describe("EditableText", () => {
  it("renders plain text in view mode with no input", () => {
    render(<EditableText value="Hello" path={["name"]} />)
    expect(screen.getByText("Hello")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("renders an input in edit mode", () => {
    render(
      <EditProvider editing markDirty={() => {}}>
        <EditableText value="Hello" path={["name"]} ariaLabel="Name" />
      </EditProvider>
    )
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Hello")
  })

  it("commits edits through setPath and calls markDirty", () => {
    let dirty = 0
    render(
      <EditProvider editing markDirty={() => (dirty += 1)}>
        <EditableText
          value={useStore.getState().name}
          path={["name"]}
          ariaLabel="Name"
        />
      </EditProvider>
    )
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Changed" },
    })
    expect(useStore.getState().name).toBe("Changed")
    expect(dirty).toBe(1)
  })
})
