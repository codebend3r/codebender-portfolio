export type Sky = "night" | "dawn" | "day" | "dusk"

type Palette = {
  bg: string
  glow1: string
  glow2: string
}

const PALETTES: Record<Sky, Palette> = {
  night: {
    bg: "#070b1a",
    glow1:
      "radial-gradient(90vw 55vh at 15% 0%, rgba(122, 162, 247, 0.28), transparent 60%)",
    glow2:
      "radial-gradient(70vw 50vh at 85% 15%, rgba(198, 120, 221, 0.24), transparent 65%)",
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
