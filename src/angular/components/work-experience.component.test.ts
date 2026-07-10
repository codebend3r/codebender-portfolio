import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { WorkExperienceComponent } from "@ngapp/components/work-experience.component"

import { experienceDuration } from "@utils/experienceDuration"

async function render() {
  await TestBed.configureTestingModule({
    imports: [WorkExperienceComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(WorkExperienceComponent)
  fixture.componentRef.setInput("index", 2)
  fixture.componentRef.setInput("eyebrow", "Experience")
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("WorkExperienceComponent", () => {
  it("renders inside a Work Experience section with the eyebrow chip", async () => {
    const root = await render()
    expect(root.querySelector("section")?.id ?? "").toBe("work-experience")
    expect(root.querySelector(".chip")?.textContent ?? "").toContain(
      "02 · Experience"
    )
  })

  it("renders one timeline item per experience", async () => {
    const root = await render()
    expect(root.querySelectorAll(".item").length).toBe(
      resume.work_experience.length
    )
  })

  it("renders role, company, and period for the first experience", async () => {
    const root = await render()
    const first = root.querySelector(".item")
    const experience = resume.work_experience[0]

    expect(first?.querySelector("h3")?.textContent?.trim() ?? "").toBe(
      experience?.role ?? ""
    )
    expect(first?.querySelector(".muted")?.textContent?.trim() ?? "").toBe(
      experience?.company ?? ""
    )
    expect(first?.querySelector(".period")?.textContent ?? "").toContain(
      experience?.period ?? ""
    )
  })

  it("renders the computed duration when the period parses", async () => {
    const root = await render()
    const experience = resume.work_experience[0]
    const duration = experienceDuration(experience?.period ?? "")

    if (duration === null) return
    expect(
      root.querySelector(".item .duration")?.textContent?.trim() ?? ""
    ).toBe(duration)
  })

  it("renders every achievement of the first experience", async () => {
    const root = await render()
    const bullets = root.querySelectorAll(".item .bullets li")
    expect(bullets.length).toBeGreaterThanOrEqual(
      resume.work_experience[0]?.achievements.length ?? 0
    )
  })
})
