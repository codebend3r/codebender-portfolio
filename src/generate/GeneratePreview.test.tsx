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

  it("renders the header stacked above full-width contact links", () => {
    // The header sits inside a <section>, which strips its banner role.
    const { container } = render(
      <GeneratePreview
        data={data()}
        name="Frontend @ Acme"
        onNameChange={() => {}}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )
    expect(container.querySelector("header")?.className ?? "").toContain(
      "stacked"
    )
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

  it("highlights lines that differ from the base resume", () => {
    const generated = data()
    generated.title = "Design Systems Lead"
    generated.summary = "Rewritten summary for the posting"
    generated.work_experience[0].achievements[0] = "Fabricated bullet"
    generated.technical_skills = ["Turborepo", ...generated.technical_skills]
    render(
      <GeneratePreview
        data={generated}
        name="N"
        onNameChange={() => {}}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )

    const classOf = (text: string, selector: string) =>
      screen.getByText(text).closest(selector)?.className ?? ""
    expect(classOf("Design Systems Lead", "p")).toContain("modified")
    expect(classOf("Rewritten summary for the posting", "p")).toContain(
      "modified"
    )
    expect(classOf("Fabricated bullet", "li")).toContain("modified")
    expect(classOf("Turborepo", "li")).toContain("modifiedPill")
  })

  it("does not highlight lines carried over from the base resume", () => {
    render(
      <GeneratePreview
        data={data()}
        name="N"
        onNameChange={() => {}}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )
    const untouched = (resume as Data).work_experience[0].achievements[0]
    expect(
      screen.getByText(untouched).closest("li")?.className ?? ""
    ).not.toContain("modified")
    expect(
      screen.getByText((resume as Data).summary).closest("p")?.className ?? ""
    ).not.toContain("modified")
  })

  it("explains the highlight with a legend", () => {
    render(
      <GeneratePreview
        data={data()}
        name="N"
        onNameChange={() => {}}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )
    expect(screen.getByText(/highlighted lines/i)).toBeInTheDocument()
  })

  it("renders the showcase section for review", () => {
    render(
      <GeneratePreview
        data={data()}
        name="N"
        onNameChange={() => {}}
        onConfirm={() => {}}
        onDiscard={() => {}}
      />
    )
    expect(
      screen.getByRole("heading", { level: 2, name: "Selected Work" })
    ).toBeInTheDocument()
  })
})
