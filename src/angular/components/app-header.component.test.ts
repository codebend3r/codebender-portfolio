import { TestBed } from "@angular/core/testing"
import { describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import { AppHeaderComponent } from "@ngapp/components/app-header.component"

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
})
