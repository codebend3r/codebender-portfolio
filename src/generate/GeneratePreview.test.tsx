import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import { GeneratePreview } from "@generate/GeneratePreview"

import { useStore } from "@state/useStore"

const data = (): Data => ({
  ...(structuredClone(resume) as Data),
  name: "Generated Name",
})

beforeEach(() => {
  useStore.getState().loadData(structuredClone(resume) as Data)
})

describe("GeneratePreview", () => {
  it("loads the generated data into the store and renders it", () => {
    render(
      <GeneratePreview
        data={data()}
        name="Frontend @ Acme"
        onNameChange={() => {}}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )
    expect(useStore.getState().name).toBe("Generated Name")
  })

  it("edits the variation name", () => {
    const onNameChange = vi.fn()
    render(
      <GeneratePreview
        data={data()}
        name="Frontend @ Acme"
        onNameChange={onNameChange}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )
    fireEvent.change(screen.getByRole("textbox", { name: /variation name/i }), {
      target: { value: "Renamed" },
    })
    expect(onNameChange).toHaveBeenCalledWith("Renamed")
  })

  it("fires confirm and discard", () => {
    const onConfirm = vi.fn()
    const onDiscard = vi.fn()
    render(
      <GeneratePreview
        data={data()}
        name="N"
        onNameChange={() => {}}
        onConfirm={onConfirm}
        onDiscard={onDiscard}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /save/i }))
    fireEvent.click(screen.getByRole("button", { name: /discard/i }))
    expect(onConfirm).toHaveBeenCalled()
    expect(onDiscard).toHaveBeenCalled()
  })
})
