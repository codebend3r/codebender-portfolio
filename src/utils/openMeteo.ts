export type Weather = "rain" | "snow" | "none"

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rain"
  | "snow"
  | "storm"
  | "unknown"

// WMO weather codes returned by Open-Meteo's `current_weather`.
// https://open-meteo.com/en/docs#weathervariables
const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
])
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])

export function weatherFromCode(code: number): Weather {
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

export function buildForecastUrl(
  coords: Pick<GeolocationCoordinates, "latitude" | "longitude">
): string {
  return (
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${coords.latitude}` +
    `&longitude=${coords.longitude}` +
    "&current_weather=true"
  )
}
