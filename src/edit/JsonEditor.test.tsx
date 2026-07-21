import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import { JsonEditor } from "@edit/JsonEditor"

import { useStore } from "@state/useStore"

beforeEach(() => {
  useStore.getState().loadData(structuredClone(resume) as Data)
})

function textarea(): HTMLTextAreaElement {
  const el = screen.getByLabelText("Resume JSON")
  if (!(el instanceof HTMLTextAreaElement)) throw new Error("no textarea")
  return el
}

describe("JsonEditor", () => {
  it("seeds the textarea with the resume as pretty JSON", () => {
    render(
      <JsonEditor
        initialData={structuredClone(resume) as Data}
        onSave={() => {}}
        markDirty={() => {}}
        persists
      />
    )
    const parsed: unknown = JSON.parse(textarea().value)
    expect(parsed).toMatchObject({ name: resume.name })
  })

  it("reports malformed JSON and does not save", () => {
    const onSave = vi.fn()
    render(
      <JsonEditor
        initialData={structuredClone(resume) as Data}
        onSave={onSave}
        markDirty={() => {}}
        persists
      />
    )
    fireEvent.change(textarea(), { target: { value: "{ not valid" } })
    fireEvent.click(screen.getByRole("button", { name: "Save JSON" }))

    expect(screen.getByRole("alert").textContent).toMatch(/invalid json/i)
    expect(onSave).not.toHaveBeenCalled()
  })

  it("reports a structural error and does not save", () => {
    const onSave = vi.fn()
    render(
      <JsonEditor
        initialData={structuredClone(resume) as Data}
        onSave={onSave}
        markDirty={() => {}}
        persists
      />
    )
    const broken = { ...(structuredClone(resume) as Data), name: 42 }
    fireEvent.change(textarea(), {
      target: { value: JSON.stringify(broken) },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save JSON" }))

    expect(screen.getByRole("alert").textContent).toContain("name")
    expect(onSave).not.toHaveBeenCalled()
  })

  it("applies valid JSON to the store and calls onSave", () => {
    const onSave = vi.fn()
    render(
      <JsonEditor
        initialData={structuredClone(resume) as Data}
        onSave={onSave}
        markDirty={() => {}}
        persists
      />
    )
    const next = { ...(structuredClone(resume) as Data), name: "Edited Name" }
    fireEvent.change(textarea(), {
      target: { value: JSON.stringify(next, null, 2) },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save JSON" }))

    expect(useStore.getState().name).toBe("Edited Name")
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status").textContent).toMatch(/valid/i)
  })

  it("marks the session dirty when the text changes", () => {
    const markDirty = vi.fn()
    render(
      <JsonEditor
        initialData={structuredClone(resume) as Data}
        onSave={() => {}}
        markDirty={markDirty}
        persists
      />
    )
    fireEvent.change(textarea(), { target: { value: "{}" } })
    expect(markDirty).toHaveBeenCalled()
  })

  it("warns that the base resume does not persist", () => {
    render(
      <JsonEditor
        initialData={structuredClone(resume) as Data}
        onSave={() => {}}
        markDirty={() => {}}
        persists={false}
      />
    )
    expect(screen.getByText(/read-only/i)).toBeInTheDocument()
  })
})
