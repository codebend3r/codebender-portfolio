import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { WorkExperience } from "@components/WorkExperience"

import resume from "@data/resume.json"

import { EditProvider } from "@edit/EditContext"

import { useStore } from "@state/useStore"

describe("WorkExperience", () => {
  it("renders inside a Work Experience section", () => {
    render(<WorkExperience />)
    expect(
      screen.getByRole("heading", { level: 2, name: "Work Experience" })
    ).toBeInTheDocument()
  })

  const mainJobs = resume.work_experience.filter((job) => !job.side_project)

  it("renders one entry per employment item, hiding side projects", () => {
    render(<WorkExperience />)
    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "Founder + Principal Engineer",
      })
    ).not.toBeInTheDocument()
    mainJobs.forEach((job) => {
      const role = screen.getAllByRole("heading", { level: 3, name: job.role })
      expect(role.length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(job.company).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(job.period)).toBeInTheDocument()
    })
  })

  it("renders all achievements for the first role", () => {
    render(<WorkExperience />)
    const first = mainJobs[0]
    const headings = screen.getAllByRole("heading", {
      level: 3,
      name: first.role,
    })
    const card = headings[0].closest("li")!
    first.achievements.forEach((line) => {
      expect(within(card).getByText(line)).toBeInTheDocument()
    })
  })

  it("renders a numbered eyebrow chip when index and eyebrow are passed", () => {
    render(<WorkExperience index={2} eyebrow="Experience" />)
    expect(screen.getByText("02 · Experience")).toBeInTheDocument()
  })

  it("shows the employment label under the period", () => {
    render(<WorkExperience />)
    const byComposedText =
      (expected: string) => (_: string, element: Element | null) =>
        (element?.textContent ?? "") === expected &&
        !!element?.querySelector("[style]")
    expect(
      screen.getAllByText(byComposedText("Full-time · Contract")).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(byComposedText("Part-time · Contract")).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(byComposedText("Full-time · Permanent")).length
    ).toBeGreaterThanOrEqual(1)
  })

  it("colours each employment value with its CSS variable", () => {
    render(<WorkExperience />)
    // The career map reuses these words as lane/legend labels, so look at
    // styled occurrences only.
    const styled = (name: string) =>
      screen
        .getAllByText(name)
        .map((el) => el.getAttribute("style") ?? "")
        .filter((style) => style.includes("--employment-"))
    expect(styled("Full-time")[0]).toContain("--employment-full-time")
    expect(styled("Part-time")[0]).toContain("--employment-part-time")
    expect(styled("Contract")[0]).toContain("--employment-contract")
    expect(styled("Permanent")[0]).toContain("--employment-permanent")
  })

  it("renders the career map with one bar per dated entry", () => {
    render(<WorkExperience />)
    expect(screen.getByText("Career map")).toBeInTheDocument()
    expect(
      screen.getByTitle("Codebender Inc. · 01/2011 - Present")
    ).toBeInTheDocument()
    mainJobs.forEach((job) => {
      expect(
        screen.getByTitle(`${job.company} · ${job.period}`)
      ).toBeInTheDocument()
    })
  })

  it("renders technology tags for roles that declare them", () => {
    render(<WorkExperience />)
    const headings = screen.getAllByRole("heading", {
      level: 3,
      name: mainJobs[0].role,
    })
    const card = headings[0].closest("li")
    expect(card).not.toBeNull()
    ;(mainJobs[0].tags ?? []).forEach((tag) => {
      expect(within(card!).getByText(tag)).toBeInTheDocument()
    })
  })

  it("shows a human-readable duration next to each period", () => {
    render(<WorkExperience />)
    // 09/2024 - 05/2026 counts 21 calendar months
    expect(
      screen.getAllByText("1 year 9 months").length
    ).toBeGreaterThanOrEqual(1)
    // 01/2024 - 09/2024 counts 9 calendar months
    expect(screen.getAllByText("9 months").length).toBeGreaterThanOrEqual(1)
  })
})

describe("WorkExperience editing", () => {
  beforeEach(() => {
    useStore.getState().loadData(structuredClone(resume) as Data)
  })

  function renderEditing() {
    return render(
      <EditProvider editing markDirty={() => {}}>
        <WorkExperience />
      </EditProvider>
    )
  }

  it("adds an experience when Add experience is clicked", () => {
    renderEditing()
    const before = useStore.getState().work_experience.length
    fireEvent.click(screen.getByRole("button", { name: /add experience/i }))
    expect(useStore.getState().work_experience.length).toBe(before + 1)
  })

  it("removes the first experience", () => {
    renderEditing()
    const second = useStore.getState().work_experience[1].company
    fireEvent.click(
      screen.getAllByRole("button", { name: /remove experience/i })[0]
    )
    expect(useStore.getState().work_experience[0].company).toBe(second)
  })

  it("updates schedule through the dropdown", () => {
    renderEditing()
    fireEvent.change(
      screen.getAllByRole("combobox", { name: /schedule/i })[0],
      { target: { value: "part-time" } }
    )
    expect(useStore.getState().work_experience[0].schedule).toBe("part-time")
  })

  it("clears arrangement when the placeholder is chosen", () => {
    renderEditing()
    fireEvent.change(
      screen.getAllByRole("combobox", { name: /arrangement/i })[0],
      { target: { value: "" } }
    )
    expect(useStore.getState().work_experience[0].arrangement).toBeUndefined()
  })

  it("adds a bullet to the first experience", () => {
    renderEditing()
    const before = useStore.getState().work_experience[0].achievements.length
    fireEvent.click(
      screen.getAllByRole("button", { name: /add achievement/i })[0]
    )
    expect(useStore.getState().work_experience[0].achievements.length).toBe(
      before + 1
    )
  })
})
