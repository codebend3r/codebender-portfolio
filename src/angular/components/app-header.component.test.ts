import { TestBed } from "@angular/core/testing"
import { describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import { AppHeaderComponent } from "@ngapp/components/app-header.component"

import { documentFileName } from "@utils/documentFileName"

vi.mock("@weather", () => ({
  fetchWeatherDetails: vi.fn(async () => null),
}))

async function render() {
  await TestBed.configureTestingModule({
    imports: [AppHeaderComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(AppHeaderComponent)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("AppHeaderComponent", () => {
  it("renders the weather clock and the header", async () => {
    const root = await render()

    expect(root.querySelector("app-weather-clock")).not.toBeNull()
    expect(root.querySelector("app-header h1")?.textContent ?? "").toContain(
      resume.name
    )
  })

  it("links Download CV to the build-time PDF", async () => {
    const root = await render()
    const link = root.querySelector("a.downloadButton")
    const expected = `/cv/${encodeURIComponent(
      documentFileName({
        name: resume.name,
        label: resume.title,
        extension: "pdf",
      })
    )}`

    expect(link?.getAttribute("href") ?? "").toBe(expected)
    expect(link?.hasAttribute("download")).toBe(true)
    expect(link?.textContent ?? "").toContain("Download CV")
  })
})
