export type Weather = "rain" | "snow" | "none"

// WMO weather codes returned by Open-Meteo's `current_weather`.
// https://open-meteo.com/en/docs#weathervariables
const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
])
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])

function weatherFromCode(code: number): Weather {
  if (RAIN_CODES.has(code)) return "rain"
  if (SNOW_CODES.has(code)) return "snow"
  return "none"
}

export function getWeatherOverride(): Weather | null {
  const value = new URLSearchParams(window.location.search).get("weather")
  if (value === "rain" || value === "snow" || value === "none") return value
  return null
}

function requestPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("geolocation unavailable"))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    })
  })
}

export async function fetchWeather(): Promise<Weather> {
  const override = getWeatherOverride()
  if (override) return override

  try {
    const { coords } = await requestPosition()
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${coords.latitude}` +
      `&longitude=${coords.longitude}` +
      "&current_weather=true"
    const res = await fetch(url)
    if (!res.ok) return "none"
    const data = (await res.json()) as {
      current_weather?: { weathercode?: number }
    }
    const code = data.current_weather?.weathercode
    if (typeof code !== "number") return "none"
    return weatherFromCode(code)
  } catch {
    return "none"
  }
}
