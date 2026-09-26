import { overrideFromSearch } from "@utils/searchOverride"
import { isSky, skyForHour } from "@utils/skyForHour"
import type { Sky } from "@utils/skyForHour"
import { getStartupThemeChoice, resolveTheme } from "@utils/theme"
import type { Theme, ThemeChoice } from "@utils/theme"

export type { Sky }

type Palette = {
  bg: string
  glow1: string
  glow2: string
}

// One palette per theme × sky phase. The dark set keeps the original deep
// backdrops; the light set washes the same phases out to daylight tones.
const PALETTES: Record<Theme, Record<Sky, Palette>> = {
  dark: {
    night: {
      bg: "#070b1a",
      glow1:
        "radial-gradient(90vw 55vh at 15% 0%, rgba(122, 162, 247, 0.26), transparent 60%)",
      glow2:
        "radial-gradient(70vw 50vh at 85% 15%, rgba(198, 120, 221, 0.20), transparent 65%)",
    },
    dawn: {
      bg: "#2a1638",
      glow1:
        "radial-gradient(95vw 65vh at 15% 100%, rgba(255, 154, 158, 0.45), transparent 60%)",
      glow2:
        "radial-gradient(75vw 70vh at 85% 100%, rgba(255, 195, 113, 0.38), transparent 65%)",
    },
    day: {
      bg: "#1c4a82",
      glow1:
        "radial-gradient(120vw 70vh at 50% -10%, rgba(180, 220, 255, 0.55), transparent 65%)",
      glow2:
        "radial-gradient(70vw 50vh at 85% 12%, rgba(255, 235, 170, 0.32), transparent 70%)",
    },
    dusk: {
      bg: "#3a1422",
      glow1:
        "radial-gradient(95vw 65vh at 15% 100%, rgba(255, 122, 89, 0.50), transparent 60%)",
      glow2:
        "radial-gradient(75vw 70vh at 85% 100%, rgba(186, 85, 211, 0.40), transparent 65%)",
    },
  },
  light: {
    night: {
      bg: "#3a4a86",
      glow1:
        "radial-gradient(90vw 55vh at 15% 0%, rgba(160, 190, 255, 0.45), transparent 60%)",
      glow2:
        "radial-gradient(70vw 50vh at 85% 15%, rgba(210, 160, 235, 0.35), transparent 65%)",
    },
    dawn: {
      bg: "#e9b8c4",
      glow1:
        "radial-gradient(95vw 65vh at 15% 100%, rgba(255, 200, 190, 0.80), transparent 60%)",
      glow2:
        "radial-gradient(75vw 70vh at 85% 100%, rgba(255, 220, 160, 0.70), transparent 65%)",
    },
    day: {
      bg: "#7fb3ea",
      glow1:
        "radial-gradient(120vw 70vh at 50% -10%, rgba(235, 245, 255, 0.75), transparent 65%)",
      glow2:
        "radial-gradient(70vw 50vh at 85% 12%, rgba(255, 236, 180, 0.55), transparent 70%)",
    },
    dusk: {
      bg: "#d98f86",
      glow1:
        "radial-gradient(95vw 65vh at 15% 100%, rgba(255, 160, 120, 0.80), transparent 60%)",
      glow2:
        "radial-gradient(75vw 70vh at 85% 100%, rgba(200, 130, 220, 0.60), transparent 65%)",
    },
  },
}

export function getCurrentSky(): Sky {
  return (
    overrideFromSearch({ key: "sky", guard: isSky }) ??
    skyForHour(new Date().getHours())
  )
}

// The React side passes the store's choice in; the default reads the same
// storage the store seeds from, so a first paint before the store exists
// resolves identically.

// Applies the resolved theme + sky palette to the document: `data-theme`
// switches every token in tokens.css, the palette vars paint the backdrop.
export function applySky(choice: ThemeChoice = getStartupThemeChoice()): Sky {
  const sky = getCurrentSky()
  const theme = resolveTheme({ choice, sky })
  const palette = PALETTES[theme][sky]
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.setProperty("--bg", palette.bg)
  root.style.setProperty("--glow1", palette.glow1)
  root.style.setProperty("--glow2", palette.glow2)
  return sky
}
