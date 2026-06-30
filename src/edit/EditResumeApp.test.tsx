import { render, screen } from "@testing-library/react"
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
})
