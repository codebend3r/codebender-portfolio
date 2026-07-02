import {
  buildForecastUrl,
  conditionFromCode,
  weatherFromCode,
} from "@utils/openMeteo"
import type { Weather, WeatherCondition } from "@utils/openMeteo"

export { conditionFromCode }
export type { Weather, WeatherCondition }

export type WeatherDetails = {
  condition: WeatherCondition
  temperature: number
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
