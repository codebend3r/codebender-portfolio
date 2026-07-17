import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EditProvider } from "@edit/EditContext"
import { EditableSelect } from "@edit/EditableSelect"

const OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
]

function renderSelect({
  onCommit,
  markDirty,
}: {
  onCommit: (next: string) => void
  markDirty: () => void
}) {
  return render(
    <EditProvider editing markDirty={markDirty}>
      <EditableSelect
        value="full-time"
        options={OPTIONS}
        placeholder="schedule"
        ariaLabel="Schedule"
        onCommit={onCommit}
      />
    </EditProvider>
  )
}

describe("EditableSelect", () => {
  it("commits the chosen value and marks dirty", () => {
    const onCommit = vi.fn()
    const markDirty = vi.fn()
    renderSelect({ onCommit, markDirty })
    fireEvent.change(screen.getByRole("combobox", { name: "Schedule" }), {
      target: { value: "part-time" },
    })
    expect(onCommit).toHaveBeenCalledWith("part-time")
    expect(markDirty).toHaveBeenCalled()
  })

  it("offers a placeholder option that commits an empty string", () => {
    const onCommit = vi.fn()
    renderSelect({ onCommit, markDirty: () => {} })
    fireEvent.change(screen.getByRole("combobox", { name: "Schedule" }), {
      target: { value: "" },
    })
    expect(onCommit).toHaveBeenCalledWith("")
  })
})
