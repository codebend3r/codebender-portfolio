import { fetchWeather, getWeatherOverride } from "@weather"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function setSearch(query: string) {
  window.history.replaceState({}, "", query ? `/?${query}` : "/")
}

describe("getWeatherOverride", () => {
  beforeEach(() => setSearch(""))
  afterEach(() => setSearch(""))

  it.each(["rain", "snow", "none"] as const)(
    "returns %s when query is valid",
    (value) => {
      setSearch(`weather=${value}`)
      expect(getWeatherOverride()).toBe(value)
    }
  )

  it("returns null when no query param is set", () => {
    expect(getWeatherOverride()).toBeNull()
  })

  it("returns null for an unknown value", () => {
    setSearch("weather=sunny")
    expect(getWeatherOverride()).toBeNull()
  })
})

describe("fetchWeather", () => {
  const realGeolocation = navigator.geolocation
  const fetchMock = vi.fn()

  beforeEach(() => {
    setSearch("")
    vi.stubGlobal("fetch", fetchMock)
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          success: (pos: GeolocationPosition) => void,
          _error?: (err: GeolocationPositionError) => void
        ) => {
          success({
            coords: {
              latitude: 43.59,
              longitude: -79.64,
              accuracy: 1,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: () => ({}),
            } as GeolocationCoordinates,
            timestamp: Date.now(),
            toJSON: () => ({}),
          } as GeolocationPosition)
        },
      },
    })
  })

  afterEach(() => {
    setSearch("")
    vi.unstubAllGlobals()
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: realGeolocation,
    })
  })

  it("short-circuits when an override is present", async () => {
    setSearch("weather=snow")
    await expect(fetchWeather()).resolves.toBe("snow")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("maps a rain weathercode (61) to 'rain'", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current_weather: { weathercode: 61 } }),
    })
    await expect(fetchWeather()).resolves.toBe("rain")
  })

  it("maps a snow weathercode (71) to 'snow'", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current_weather: { weathercode: 71 } }),
    })
    await expect(fetchWeather()).resolves.toBe("snow")
  })

  it("returns 'none' for clear-sky codes (0)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current_weather: { weathercode: 0 } }),
    })
    await expect(fetchWeather()).resolves.toBe("none")
  })

  it("returns 'none' when the response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) })
    await expect(fetchWeather()).resolves.toBe("none")
  })

  it("returns 'none' when payload lacks a weathercode", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    await expect(fetchWeather()).resolves.toBe("none")
  })

  it("returns 'none' when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"))
    await expect(fetchWeather()).resolves.toBe("none")
  })

  it("returns 'none' when geolocation rejects", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: (pos: GeolocationPosition) => void,
          error?: (err: GeolocationPositionError) => void
        ) => {
          error?.({ code: 1, message: "denied" } as GeolocationPositionError)
        },
      },
    })
    await expect(fetchWeather()).resolves.toBe("none")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("returns 'none' when geolocation is unavailable", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    })
    await expect(fetchWeather()).resolves.toBe("none")
  })
})
