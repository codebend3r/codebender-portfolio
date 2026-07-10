import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { LanguagesComponent } from "@ngapp/components/languages.component"

describe("LanguagesComponent", () => {
  it("renders every language with its proficiency", async () => {
    await TestBed.configureTestingModule({
      imports: [LanguagesComponent],
    }).compileComponents()
    const fixture = TestBed.createComponent(LanguagesComponent)
    fixture.detectChanges()
    const root: HTMLElement = fixture.nativeElement

    expect(root.querySelector("section")?.id ?? "").toBe("languages")

    const items = [...root.querySelectorAll("li")]
    expect(items.length).toBe(resume.languages.length)

    const language = resume.languages[0]
    expect(items[0]?.textContent ?? "").toContain(language?.name ?? "")
    expect(items[0]?.textContent ?? "").toContain(language?.proficiency ?? "")
  })
})
