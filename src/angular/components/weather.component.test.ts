import { TestBed } from "@angular/core/testing"
import { fetchWeather, getWeatherOverride } from "@weather"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WeatherComponent } from "@ngapp/components/weather.component"

vi.mock("@weather", () => ({
  getWeatherOverride: vi.fn(() => null),
  fetchWeather: vi.fn(async () => "none"),
}))

const mockedOverride = vi.mocked(getWeatherOverride)
const mockedFetch = vi.mocked(fetchWeather)

async function render() {
  await TestBed.configureTestingModule({
    imports: [WeatherComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(WeatherComponent)
  fixture.detectChanges()
  await fixture.whenStable()
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("WeatherComponent", () => {
  beforeEach(() => {
    mockedOverride.mockReturnValue(null)
    mockedFetch.mockResolvedValue("none")
  })

  it("renders nothing when the weather is clear", async () => {
    const root = await render()
    expect(root.querySelector(".weather")).toBeNull()
  })

  it("renders raindrops when the override is rain", async () => {
    mockedOverride.mockReturnValue("rain")
    const root = await render()

    expect(root.querySelectorAll(".raindrop").length).toBe(140)
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it("renders snowflakes when the override is snow", async () => {
    mockedOverride.mockReturnValue("snow")
    const root = await render()

    expect(root.querySelectorAll(".snowflake").length).toBe(90)
  })

  it("renders the fetched weather without an override", async () => {
    mockedFetch.mockResolvedValue("rain")
    const root = await render()

    expect(mockedFetch).toHaveBeenCalledOnce()
    expect(root.querySelectorAll(".raindrop").length).toBe(140)
  })
})
