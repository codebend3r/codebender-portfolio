import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VariationsPanel } from "@edit/VariationsPanel"

import { useVariations } from "@state/useVariations"

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
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

  it("calls onNew when New is clicked", () => {
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
    expect(onNew).toHaveBeenCalledOnce()
  })

  it("disables Save on Base", () => {
    render(
      <VariationsPanel dirty onSave={noop} onGenerate={noop} onNew={noop} />
    )
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()
  })
})
