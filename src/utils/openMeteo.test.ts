import { describe, expect, it } from "vitest"

import {
  buildForecastUrl,
  conditionFromCode,
  weatherFromCode,
} from "@utils/openMeteo"

describe("weatherFromCode", () => {
  it.each([51, 61, 65, 80, 82, 95, 99])("maps code %i to rain", (code) => {
    expect(weatherFromCode(code)).toBe("rain")
  })

  it.each([71, 73, 75, 77, 85, 86])("maps code %i to snow", (code) => {
    expect(weatherFromCode(code)).toBe("snow")
  })

  it.each([0, 1, 3, 45, 123])("maps code %i to none", (code) => {
    expect(weatherFromCode(code)).toBe("none")
  })
})

describe("conditionFromCode", () => {
  it.each([
    [0, "clear"],
    [1, "cloudy"],
    [2, "cloudy"],
    [3, "cloudy"],
    [45, "cloudy"],
    [48, "cloudy"],
    [51, "rain"],
    [61, "rain"],
    [80, "rain"],
    [71, "snow"],
    [77, "snow"],
    [85, "snow"],
    [95, "storm"],
    [96, "storm"],
    [99, "storm"],
    [123, "unknown"],
  ] as const)("maps weathercode %i to %s", (code, expected) => {
    expect(conditionFromCode(code)).toBe(expected)
  })
})

describe("buildForecastUrl", () => {
  it("builds the Open-Meteo current-weather URL from coordinates", () => {
    expect(buildForecastUrl({ latitude: 43.59, longitude: -79.64 })).toBe(
      "https://api.open-meteo.com/v1/forecast?latitude=43.59&longitude=-79.64&current_weather=true"
    )
  })
})
