import { parsePeriod } from "@utils/period"
import { slugify } from "@utils/slugify"

export function experienceId({
  company,
  period,
}: {
  company: string
  period: string
}): string {
  const parsed = parsePeriod({ period })
  if (!parsed) {
    // Fallback: extract year from period string directly
    const yearMatch = period.match(/(\d{4})/)
    const year = yearMatch ? yearMatch[1] : "unknown"
    return `${slugify(company)}_${year}`
  }

  // Convert month index to year
  const startYear = Math.floor(parsed.start / 12)
  return `${slugify(company)}_${startYear}`
}
