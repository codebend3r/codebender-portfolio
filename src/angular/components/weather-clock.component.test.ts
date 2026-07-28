import { TestBed } from "@angular/core/testing"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WeatherClockComponent } from "@ngapp/components/weather-clock.component"

import { fetchWeatherDetails } from "@weather"

vi.mock("@weather", () => ({
  fetchWeatherDetails: vi.fn(async () => null),
}))

const mockedDetails = vi.mocked(fetchWeatherDetails)

async function render() {
  await TestBed.configureTestingModule({
    imports: [WeatherClockComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(WeatherClockComponent)
  fixture.detectChanges()
  await fixture.whenStable()
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("WeatherClockComponent", () => {
  beforeEach(() => {
    mockedDetails.mockResolvedValue(null)
  })

  it("renders the date and time", async () => {
    const root = await render()
    const now = new Date()

    expect(root.querySelector(".date")?.textContent ?? "").toContain(
      now.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    )
    expect(root.querySelector(".time")?.textContent ?? "").not.toBe("")
  })

  it("hides the weather block until details resolve", async () => {
    const root = await render()
    expect(root.querySelector(".weather")).toBeNull()
  })

  it("shows condition icon and rounded temperature", async () => {
    mockedDetails.mockResolvedValue({ condition: "clear", temperature: 21.4 })
    const root = await render()

    expect(root.querySelector(".weather")?.textContent ?? "").toContain("☀️")
    expect(root.querySelector(".weather")?.textContent ?? "").toContain("21°C")
  })
})
