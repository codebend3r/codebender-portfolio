import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VariationsPanel } from "@edit/VariationsPanel"

import { useVariations } from "@state/useVariations"

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null, pendingDeletes: [] })
})

const noop = () => {}

describe("VariationsPanel", () => {
  it("always shows a Base entry", () => {
    render(
      <VariationsPanel
        dirty={false}
        onSave={noop}
        onGenerate={noop}
        onNew={noop}
      />
    )
    expect(screen.getByRole("button", { name: /base/i })).toBeInTheDocument()
  })

  it("lists saved variations", () => {
    useVariations.setState({
      variations: [
        {
          id: "1",
          name: "Globe",
          createdAt: 0,
          updatedAt: 0,
          data: {} as Data,
        },
      ],
      activeId: "1",
    })
    render(
      <VariationsPanel
        dirty={false}
        onSave={noop}
        onGenerate={noop}
        onNew={noop}
      />
    )
    expect(screen.getByRole("button", { name: "Globe" })).toBeInTheDocument()
  })

  it("opens a modal on New and calls onNew with the entered name", () => {
    const onNew = vi.fn()
    render(
      <VariationsPanel
        dirty={false}
        onSave={noop}
        onGenerate={noop}
        onNew={onNew}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /new/i }))

    const input = screen.getByRole("textbox", { name: /name this variation/i })
    expect(input).toHaveValue("Variation 1")
    fireEvent.change(input, { target: { value: "  Consulting  " } })
    fireEvent.click(screen.getByRole("button", { name: /create/i }))

    expect(onNew).toHaveBeenCalledWith("Consulting")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renames a variation through the modal", () => {
    useVariations.setState({
      variations: [
        {
          id: "1",
          name: "Globe",
          createdAt: 0,
          updatedAt: 0,
          data: {} as Data,
        },
      ],
      activeId: "1",
    })
    render(
      <VariationsPanel
        dirty={false}
        onSave={noop}
        onGenerate={noop}
        onNew={noop}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /rename globe/i }))

    const dialog = screen.getByRole("dialog")
    const input = within(dialog).getByRole("textbox", {
      name: /rename variation/i,
    })
    expect(input).toHaveValue("Globe")
    fireEvent.change(input, { target: { value: "Globe and Mail" } })
    fireEvent.click(within(dialog).getByRole("button", { name: /save/i }))

    expect(useVariations.getState().variations[0].name).toBe("Globe and Mail")
  })

  it("disables Save on Base", () => {
    render(
      <VariationsPanel dirty onSave={noop} onGenerate={noop} onNew={noop} />
    )
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()
  })
})
