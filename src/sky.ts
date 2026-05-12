export type Sky = "night" | "dawn" | "day" | "dusk"

type Palette = {
  bg: string
  glow1: string
  glow2: string
}

const PALETTES: Record<Sky, Palette> = {
  night: {
    bg: "#0b0e14",
    glow1:
      "radial-gradient(90vw 55vh at 15% 0%, rgba(122, 162, 247, 0.15), transparent 55%)",
    glow2:
      "radial-gradient(70vw 50vh at 85% 15%, rgba(198, 120, 221, 0.14), transparent 65%)",
  },
  dawn: {
    bg: "#150d1f",
    glow1:
      "radial-gradient(90vw 55vh at 15% 100%, rgba(255, 154, 158, 0.20), transparent 55%)",
    glow2:
      "radial-gradient(70vw 60vh at 85% 100%, rgba(255, 195, 113, 0.18), transparent 65%)",
  },
  day: {
    bg: "#0a1828",
    glow1:
      "radial-gradient(90vw 55vh at 15% 0%, rgba(95, 168, 255, 0.22), transparent 55%)",
    glow2:
      "radial-gradient(70vw 50vh at 85% 15%, rgba(159, 211, 255, 0.18), transparent 65%)",
  },
  dusk: {
    bg: "#1a0f1a",
    glow1:
      "radial-gradient(90vw 55vh at 15% 100%, rgba(255, 122, 89, 0.22), transparent 55%)",
    glow2:
      "radial-gradient(70vw 60vh at 85% 100%, rgba(186, 85, 211, 0.20), transparent 65%)",
  },
}

function skyForHour(hour: number): Sky {
  if (hour >= 5 && hour < 8) return "dawn"
  if (hour >= 8 && hour < 17) return "day"
  if (hour >= 17 && hour < 20) return "dusk"
  return "night"
}

function getOverride(): Sky | null {
  const value = new URLSearchParams(window.location.search).get("sky")
  if (value && value in PALETTES) return value as Sky
  return null
}

export function getCurrentSky(): Sky {
  return getOverride() ?? skyForHour(new Date().getHours())
}

export function applySky(): Sky {
  const sky = getCurrentSky()
  const palette = PALETTES[sky]
  const root = document.documentElement
  root.style.setProperty("--bg", palette.bg)
  root.style.setProperty("--glow1", palette.glow1)
  root.style.setProperty("--glow2", palette.glow2)
  return sky
}
