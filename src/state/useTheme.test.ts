import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { useTheme } from "@state/useTheme"

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear()
    useTheme.setState({ choice: "auto" })
  })

  afterEach(() => {
    window.localStorage.clear()
    useTheme.setState({ choice: "auto" })
  })

  it("defaults to auto", () => {
    expect(useTheme.getState().choice).toBe("auto")
  })

  it("persists a valid choice to localStorage", () => {
    useTheme.getState().setChoice("light")
    expect(useTheme.getState().choice).toBe("light")
    expect(window.localStorage.getItem("theme-choice")).toBe("light")
  })

  it("switches between choices", () => {
    useTheme.getState().setChoice("dark")
    useTheme.getState().setChoice("auto")
    expect(useTheme.getState().choice).toBe("auto")
    expect(window.localStorage.getItem("theme-choice")).toBe("auto")
  })
})
