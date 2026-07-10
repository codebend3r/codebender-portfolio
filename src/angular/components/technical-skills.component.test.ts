import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { TechnicalSkillsComponent } from "@ngapp/components/technical-skills.component"

async function render() {
  await TestBed.configureTestingModule({
    imports: [TechnicalSkillsComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(TechnicalSkillsComponent)
  fixture.componentRef.setInput("index", 1)
  fixture.componentRef.setInput("eyebrow", "Stack")
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("TechnicalSkillsComponent", () => {
  it("renders inside a Technical Skills section", async () => {
    const root = await render()
    expect(root.querySelector("section")?.id ?? "").toBe("technical-skills")
  })

  it("renders one pill per skill with its label", async () => {
    const root = await render()
    const pills = [...root.querySelectorAll("li.pill")]

    expect(pills.length).toBe(resume.technical_skills.length)
    expect(pills[0]?.textContent ?? "").toContain(resume.technical_skills[0])
  })

  it("renders a tooltip per pill", async () => {
    const root = await render()
    const tooltips = [...root.querySelectorAll("[data-skill-tooltip]")]

    expect(tooltips.length).toBe(resume.technical_skills.length)
    expect(tooltips[0]?.getAttribute("role") ?? "").toBe("tooltip")
    expect(tooltips[0]?.textContent ?? "").toContain(
      (resume.skill_descriptions[0] ?? "").slice(0, 30)
    )
  })

  it("renders a numbered eyebrow chip", async () => {
    const root = await render()
    expect(root.querySelector(".chip")?.textContent ?? "").toContain(
      "01 · Stack"
    )
  })

  it("labels each pill for screen readers", async () => {
    const root = await render()
    const first = root.querySelector("li.pill")
    expect(first?.getAttribute("aria-label") ?? "").toContain(
      `${resume.technical_skills[0]}:`
    )
  })
})
