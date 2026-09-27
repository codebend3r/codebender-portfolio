import { parsePeriod } from "@utils/period"

// Turns a resume period ("09/2024 - 05/2026" or "11/2023 - Present") into a
// human-readable length like "1 year 9 months". Every calendar month the
// period touches counts as a full month, so partial months always round up.
// Returns null when the period cannot be parsed or lies in the future.
export function experienceDuration(
  period: string,
  now: Date = new Date()
): string | null {
  const parsed = parsePeriod({ period, now })
  if (!parsed) return null

  const months = parsed.end - parsed.start + 1
  if (months < 1) return null

  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`)
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`)
  return parts.join(" ")
}
