import { act, render, waitFor } from "@testing-library/react"
import { fetchWeather, getWeatherOverride } from "@weather"
import type { Weather as WeatherKind } from "@weather"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Weather } from "@components/Weather"

vi.mock("@weather", () => ({
  fetchWeather: vi.fn(),
  getWeatherOverride: vi.fn(() => null),
}))

const mockedFetch = vi.mocked(fetchWeather)
const mockedOverride = vi.mocked(getWeatherOverride)

describe("Weather", () => {
  beforeEach(() => {
    mockedOverride.mockReturnValue(null)
    mockedFetch.mockResolvedValue("none")
  })

  afterEach(() => {
    mockedFetch.mockReset()
    mockedOverride.mockReset()
  })

  it("renders nothing when weather is 'none'", async () => {
    mockedFetch.mockResolvedValue("none")
    const { container } = render(<Weather />)
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled())
    expect(container.firstChild).toBeNull()
  })

  it("renders the rain layer when fetch returns 'rain'", async () => {
    mockedFetch.mockResolvedValue("rain")
    const { container } = render(<Weather />)
    await waitFor(() => {
      const layer = container.firstElementChild
      expect(layer).not.toBeNull()
      expect(layer?.children.length).toBe(140)
    })
  })

  it("renders the snow layer when fetch returns 'snow'", async () => {
    mockedFetch.mockResolvedValue("snow")
    const { container } = render(<Weather />)
    await waitFor(() => {
      const layer = container.firstElementChild
      expect(layer).not.toBeNull()
      expect(layer?.children.length).toBe(90)
    })
  })

  it("uses the override synchronously and skips fetchWeather", async () => {
    mockedOverride.mockReturnValue("snow")
    const { container } = render(<Weather />)
    const layer = container.firstElementChild
    expect(layer).not.toBeNull()
    expect(layer?.children.length).toBe(90)
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it("ignores `fetchWeather` resolution after unmount", async () => {
    let resolveFetch: (value: WeatherKind) => void = () => {}
    mockedFetch.mockImplementationOnce(
      () =>
        new Promise<WeatherKind>((resolve) => {
          resolveFetch = resolve
        })
    )
    const { container, unmount } = render(<Weather />)
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled())
    unmount()
    await act(async () => {
      resolveFetch("rain")
    })
    expect(container.firstChild).toBeNull()
  })
})
