import { TestBed } from "@angular/core/testing"
import { describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import { AppComponent } from "@ngapp/app.component"

vi.mock("@weather", () => ({
  getWeatherOverride: vi.fn(() => "none"),
  fetchWeather: vi.fn(async () => "none"),
  fetchWeatherDetails: vi.fn(async () => null),
}))

vi.mock("@sky", () => ({
  getCurrentSky: vi.fn(() => "night"),
}))

describe("AppComponent", () => {
  it("composes the full homepage", async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents()

    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    await fixture.whenStable()
    const root: HTMLElement = fixture.nativeElement

    expect(root.querySelector("app-sky .skyStage")).not.toBeNull()
    expect(root.querySelector("app-section-nav nav")).not.toBeNull()
    expect(root.querySelector("#resume-root")).not.toBeNull()
    expect(
      root.querySelector("app-header-bar h1")?.textContent ?? ""
    ).toContain(resume.name)

    const sectionIds = [...root.querySelectorAll("main section")].map(
      (section) => section.id
    )
    expect(sectionIds).toEqual([
      "summary",
      "technical-skills",
      "soft-skills",
      "work-experience",
      "selected-work",
      "awards",
      "languages",
      "education",
    ])

    expect(
      root.querySelector("app-footer .credit")?.textContent ?? ""
    ).toContain(resume.name)
  })
})
