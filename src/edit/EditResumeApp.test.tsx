import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import EditResumeApp from "@edit/EditResumeApp"

import { useStore } from "@state/useStore"
import { useVariations } from "@state/useVariations"

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
  useStore.getState().loadData(structuredClone(resume) as Data)
})

describe("EditResumeApp", () => {
  it("renders the resume with the variations panel", () => {
    render(<EditResumeApp />)
    expect(screen.getByRole("button", { name: /base/i })).toBeInTheDocument()
    expect(
      screen.getAllByRole("heading", { level: 1, name: resume.name }).length
    ).toBeGreaterThanOrEqual(1)
  })

  it("loads a saved variation's data into the store on mount", () => {
    useVariations.setState({
      variations: [
        {
          id: "1",
          name: "X",
          createdAt: 0,
          updatedAt: 0,
          data: { ...(structuredClone(resume) as Data), name: "Variant Name" },
        },
      ],
      activeId: "1",
    })
    render(<EditResumeApp />)
    expect(useStore.getState().name).toBe("Variant Name")
  })

  it("switches to the JSON view and shows the resume as JSON", () => {
    render(<EditResumeApp />)
    fireEvent.click(screen.getByRole("button", { name: "JSON" }))

    const el = screen.getByLabelText("Resume JSON")
    expect(el).toBeInTheDocument()
    if (!(el instanceof HTMLTextAreaElement)) throw new Error("no textarea")
    const parsed: unknown = JSON.parse(el.value)
    expect(parsed).toMatchObject({ name: resume.name })
  })

  it("keeps the JSON view when switching variations", () => {
    useVariations.setState({
      variations: [
        {
          id: "1",
          name: "X",
          createdAt: 0,
          updatedAt: 0,
          data: { ...(structuredClone(resume) as Data), name: "Variant Name" },
        },
      ],
      activeId: null,
    })
    render(<EditResumeApp />)
    fireEvent.click(screen.getByRole("button", { name: "JSON" }))
    fireEvent.click(screen.getByRole("button", { name: "X" }))

    const el = screen.getByLabelText("Resume JSON")
    if (!(el instanceof HTMLTextAreaElement)) throw new Error("no textarea")
    const parsed: unknown = JSON.parse(el.value)
    expect(parsed).toMatchObject({ name: "Variant Name" })
  })
})
