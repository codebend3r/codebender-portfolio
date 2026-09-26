import { afterEach, describe, expect, it } from "vitest"

import {
  getThemeOverride,
  isThemeChoice,
  readStoredThemeChoice,
  resolveTheme,
  storeThemeChoice,
  themeForSky,
} from "@utils/theme"

function setSearch(query: string) {
  window.history.replaceState({}, "", query ? `/?${query}` : "/")
}

afterEach(() => {
  setSearch("")
  window.localStorage.clear()
})

describe("isThemeChoice", () => {
  it("accepts the choice literals", () => {
    expect(isThemeChoice("auto")).toBe(true)
    expect(isThemeChoice("light")).toBe(true)
    expect(isThemeChoice("dark")).toBe(true)
  })

  it("rejects other values", () => {
    expect(isThemeChoice("day")).toBe(false)
    expect(isThemeChoice("")).toBe(false)
    expect(isThemeChoice(null)).toBe(false)
    expect(isThemeChoice(7)).toBe(false)
  })
})

describe("themeForSky", () => {
  it("maps bright skies to light", () => {
    expect(themeForSky("day")).toBe("light")
    expect(themeForSky("dawn")).toBe("light")
  })

  it("maps dark skies to dark", () => {
    expect(themeForSky("dusk")).toBe("dark")
    expect(themeForSky("night")).toBe("dark")
  })
})

describe("resolveTheme", () => {
  it("follows the sky in auto mode", () => {
    expect(resolveTheme({ choice: "auto", sky: "day" })).toBe("light")
    expect(resolveTheme({ choice: "auto", sky: "night" })).toBe("dark")
  })

  it("honours an explicit choice regardless of sky", () => {
    expect(resolveTheme({ choice: "dark", sky: "day" })).toBe("dark")
    expect(resolveTheme({ choice: "light", sky: "night" })).toBe("light")
  })
})

describe("stored theme choice", () => {
  it("round-trips through localStorage", () => {
    storeThemeChoice("dark")
    expect(readStoredThemeChoice()).toBe("dark")
  })

  it("returns null when nothing valid is stored", () => {
    expect(readStoredThemeChoice()).toBeNull()
    window.localStorage.setItem("theme-choice", "banana")
    expect(readStoredThemeChoice()).toBeNull()
  })
})

describe("getThemeOverride", () => {
  it("returns a valid ?theme= override", () => {
    setSearch("theme=light")
    expect(getThemeOverride()).toBe("light")
  })

  it("ignores unknown overrides and absence", () => {
    setSearch("theme=banana")
    expect(getThemeOverride()).toBeNull()
    setSearch("")
    expect(getThemeOverride()).toBeNull()
  })
})
