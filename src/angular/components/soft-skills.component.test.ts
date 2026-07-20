import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { SoftSkillsComponent } from "@ngapp/components/soft-skills.component"

describe("SoftSkillsComponent", () => {
  it("renders one pill per soft skill", async () => {
    await TestBed.configureTestingModule({
      imports: [SoftSkillsComponent],
    }).compileComponents()
    const fixture = TestBed.createComponent(SoftSkillsComponent)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement

    expect(root.querySelector("section")?.id ?? "").toBe("soft-skills")

    const pills = [...root.querySelectorAll("li")]
    expect(pills.length).toBe(resume.soft_skills.length)
    expect(pills[0]?.textContent?.trim() ?? "").toBe(
      resume.soft_skills[0] ?? ""
    )
  })
})
