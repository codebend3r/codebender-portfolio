export type Sky = "night" | "dawn" | "day" | "dusk"

const SKIES: readonly Sky[] = ["night", "dawn", "day", "dusk"]

export const isSky = (value: unknown): value is Sky =>
  SKIES.some((sky) => sky === value)

export function skyForHour(hour: number): Sky {
  if (hour >= 5 && hour < 8) return "dawn"
  if (hour >= 8 && hour < 17) return "day"
  if (hour >= 17 && hour < 20) return "dusk"
  return "night"
}
