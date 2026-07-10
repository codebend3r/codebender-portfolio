import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { SummaryComponent } from "@ngapp/components/summary.component"

describe("SummaryComponent", () => {
  it("renders the resume summary inside the Summary section", async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryComponent],
    }).compileComponents()
    const fixture = TestBed.createComponent(SummaryComponent)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement

    expect(root.querySelector("section")?.id ?? "").toBe("summary")
    expect(root.querySelector("p")?.textContent ?? "").toContain(
      resume.summary.slice(0, 40)
    )
  })
})
