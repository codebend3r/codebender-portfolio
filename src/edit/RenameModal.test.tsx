import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { RenameModal } from "@edit/RenameModal"

const baseProps = {
  open: true,
  title: "Name this variation",
  initialName: "Variation 2",
  confirmLabel: "Create",
  onConfirm: () => {},
  onClose: () => {},
}

describe("RenameModal", () => {
  it("renders nothing when closed", () => {
    render(<RenameModal {...baseProps} open={false} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("prefills the input with the initial name", () => {
    render(<RenameModal {...baseProps} />)
    expect(screen.getByRole("textbox")).toHaveValue("Variation 2")
  })

  it("confirms with the trimmed name", () => {
    const onConfirm = vi.fn()
    render(<RenameModal {...baseProps} onConfirm={onConfirm} />)
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  Startup  " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create" }))
    expect(onConfirm).toHaveBeenCalledWith("Startup")
  })

  it("disables confirm when the name is blank", () => {
    render(<RenameModal {...baseProps} />)
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "   " },
    })
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled()
  })

  it("closes on Cancel without confirming", () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <RenameModal {...baseProps} onConfirm={onConfirm} onClose={onClose} />
    )
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("closes on Escape", () => {
    const onClose = vi.fn()
    render(<RenameModal {...baseProps} onClose={onClose} />)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
