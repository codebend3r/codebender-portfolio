import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { AwardsComponent } from "@ngapp/components/awards.component"

describe("AwardsComponent", () => {
  it("renders every award with name, organization, and year", async () => {
    await TestBed.configureTestingModule({
      imports: [AwardsComponent],
    }).compileComponents()
    const fixture = TestBed.createComponent(AwardsComponent)
    fixture.componentRef.setInput("index", 4)
    fixture.componentRef.setInput("eyebrow", "Recognition")
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement

    expect(root.querySelector("section")?.id ?? "").toBe("awards")
    expect(root.querySelector(".chip")?.textContent ?? "").toContain(
      "04 · Recognition"
    )

    const items = [...root.querySelectorAll("li")]
    expect(items.length).toBe(resume.awards.length)

    const award = resume.awards[0]
    expect(items[0]?.textContent ?? "").toContain(award?.name ?? "")
    expect(items[0]?.textContent ?? "").toContain(award?.organization ?? "")
    expect(items[0]?.textContent ?? "").toContain(String(award?.year ?? ""))
  })
})
