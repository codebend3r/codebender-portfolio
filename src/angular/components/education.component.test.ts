import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { EducationComponent } from "@ngapp/components/education.component"

describe("EducationComponent", () => {
  it("renders every education entry with program and institution", async () => {
    await TestBed.configureTestingModule({
      imports: [EducationComponent],
    }).compileComponents()
    const fixture = TestBed.createComponent(EducationComponent)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement

    expect(root.querySelector("section")?.id ?? "").toBe("education")

    const items = [...root.querySelectorAll("li")]
    expect(items.length).toBe(resume.education.length)

    const entry = resume.education[0]
    expect(items[0]?.textContent ?? "").toContain(entry?.program ?? "")
    expect(items[0]?.textContent ?? "").toContain(entry?.institution ?? "")
  })
})
