export type Weather = "rain" | "snow" | "none"

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rain"
  | "snow"
  | "storm"
  | "unknown"

export type WeatherDetails = {
  condition: WeatherCondition
  temperature: number
}

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

export function conditionFromCode(code: number): WeatherCondition {
  if (code === 0) return "clear"
  if (code === 1 || code === 2 || code === 3) return "cloudy"
  if (code === 45 || code === 48) return "cloudy"
  if (code === 95 || code === 96 || code === 99) return "storm"
  if (SNOW_CODES.has(code)) return "snow"
  if (RAIN_CODES.has(code)) return "rain"
  return "unknown"
}

export function getWeatherOverride(): Weather | null {
  const value = new URLSearchParams(window.location.search).get("weather")
  if (value === "rain" || value === "snow" || value === "none") return value
  return null
}

let inFlightPosition: Promise<GeolocationPosition> | null = null

function requestPosition(): Promise<GeolocationPosition> {
  if (inFlightPosition) return inFlightPosition
  inFlightPosition = new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("geolocation unavailable"))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    })
  }).finally(() => {
    inFlightPosition = null
  })
  return inFlightPosition
}

function buildForecastUrl(coords: GeolocationCoordinates): string {
  return (
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${coords.latitude}` +
    `&longitude=${coords.longitude}` +
    "&current_weather=true"
  )
}

export async function fetchWeather(): Promise<Weather> {
  const override = getWeatherOverride()
  if (override) return override

  try {
    const { coords } = await requestPosition()
    const res = await fetch(buildForecastUrl(coords))
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

export async function fetchWeatherDetails(): Promise<WeatherDetails | null> {
  try {
    const { coords } = await requestPosition()
    const res = await fetch(buildForecastUrl(coords))
    if (!res.ok) return null
    const data = (await res.json()) as {
      current_weather?: { weathercode?: number; temperature?: number }
    }
    const code = data.current_weather?.weathercode
    const temperature = data.current_weather?.temperature
    if (typeof code !== "number" || typeof temperature !== "number") return null
    return { condition: conditionFromCode(code), temperature }
  } catch {
    return null
  }
}
