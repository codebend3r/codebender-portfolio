import type { Sky } from "@utils/skyForHour"

export type Theme = "light" | "dark"
export type ThemeChoice = "auto" | Theme

const CHOICES: readonly ThemeChoice[] = ["auto", "light", "dark"]

export const isThemeChoice = (value: unknown): value is ThemeChoice =>
  CHOICES.some((choice) => choice === value)

// Auto mode follows the sky: bright skies read as light mode, dark as dark.
export const themeForSky = (sky: Sky): Theme =>
  sky === "day" || sky === "dawn" ? "light" : "dark"

export const resolveTheme = ({
  choice,
  sky,
}: {
  choice: ThemeChoice
  sky: Sky
}): Theme => (choice === "auto" ? themeForSky(sky) : choice)

const STORAGE_KEY = "theme-choice"

// localStorage access can throw (private windows, blocked site data), so
// both accessors swallow failures and fall back to defaults.
export function readStoredThemeChoice(): ThemeChoice | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return isThemeChoice(value) ? value : null
  } catch {
    return null
  }
}

export function storeThemeChoice(choice: ThemeChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    /* per-viewer convenience only; losing it is fine */
  }
}

// Mirrors the ?sky= and ?weather= overrides for stable screenshots.
export function getThemeOverride(): ThemeChoice | null {
  const value = new URLSearchParams(window.location.search).get("theme")
  return isThemeChoice(value) ? value : null
}

// First-paint choice: the ?theme= override wins for the session but is
// never persisted, so a shared screenshot link doesn't overwrite the
// viewer's saved preference.
export function getStartupThemeChoice(): ThemeChoice {
  return getThemeOverride() ?? readStoredThemeChoice() ?? "auto"
}
