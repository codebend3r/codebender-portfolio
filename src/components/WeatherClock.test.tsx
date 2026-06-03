import { act, render, screen, waitFor } from "@testing-library/react"
import { fetchWeatherDetails } from "@weather"
import type { WeatherDetails } from "@weather"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { WeatherClock } from "@components/WeatherClock"

vi.mock("@weather", () => ({
  fetchWeatherDetails: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchWeatherDetails)

describe("WeatherClock", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setInterval", "clearInterval", "Date"],
    })
    vi.setSystemTime(new Date("2026-05-26T13:42:00"))
  })

  afterEach(() => {
    vi.useRealTimers()
    mockedFetch.mockReset()
  })

  it("renders date and time when weather is unavailable", async () => {
    mockedFetch.mockResolvedValue(null)
    render(<WeatherClock />)

    await waitFor(() => expect(mockedFetch).toHaveBeenCalled())

    expect(screen.queryByText(/°C/)).toBeNull()
    expect(screen.getByText(/Tue/)).toBeInTheDocument()
    expect(screen.getByText(/1:42/)).toBeInTheDocument()
  })

  it("renders the weather row when fetch resolves", async () => {
    mockedFetch.mockResolvedValue({ condition: "cloudy", temperature: 18.4 })
    render(<WeatherClock />)

    await waitFor(() => expect(screen.getByText(/18°C/)).toBeInTheDocument())
    expect(screen.getByText(/☁️/)).toBeInTheDocument()
  })

  it("re-renders the time after a minute elapses", async () => {
    mockedFetch.mockResolvedValue(null)
    render(<WeatherClock />)

    await waitFor(() => expect(screen.getByText(/1:42/)).toBeInTheDocument())

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText(/1:43/)).toBeInTheDocument()
  })

  it("ignores `fetchWeatherDetails` resolution after unmount", async () => {
    let resolveFetch: (value: WeatherDetails | null) => void = () => {}
    mockedFetch.mockImplementationOnce(
      () =>
        new Promise<WeatherDetails | null>((resolve) => {
          resolveFetch = resolve
        })
    )
    const { unmount } = render(<WeatherClock />)
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled())
    unmount()
    await act(async () => {
      resolveFetch({ condition: "cloudy", temperature: 18.4 })
    })
    expect(screen.queryByText(/18°C/)).toBeNull()
  })
})
