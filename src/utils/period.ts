// Parses a resume period string into absolute month indexes.
// Month index is year * 12 + (month - 1), e.g., January 2011 = 2011 * 12 + 0 = 24132.
const PERIOD_PATTERN =
  /^(\d{1,2})\/(\d{4})\s*-\s*(?:(present)|(\d{1,2})\/(\d{4}))$/i

type PeriodIndex = {
  start: number
  end: number
}

export function parsePeriod({
  period,
  now = new Date(),
}: {
  period: string
  now?: Date
}): PeriodIndex | null {
  const match = period.trim().match(PERIOD_PATTERN)
  if (!match) return null

  const [, startMonth, startYear, present, endMonth, endYear] = match

  const start = Number(startYear) * 12 + (Number(startMonth) - 1)
  const end = present
    ? now.getFullYear() * 12 + now.getMonth()
    : Number(endYear) * 12 + (Number(endMonth) - 1)

  return end >= start ? { start, end } : null
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const monthLabel = (index: number): string =>
  `${MONTHS[index % 12]} ${Math.floor(index / 12)}`

// Turns "02/2012 - 03/2014" into "Feb 2012 – Mar 2014", keeping an
// open-ended period as "Present" rather than today's month.
export function formatPeriod({ period }: { period: string }): string | null {
  const parsed = parsePeriod({ period })
  if (!parsed) return null
  const end = /present$/i.test(period.trim())
    ? "Present"
    : monthLabel(parsed.end)
  return `${monthLabel(parsed.start)} – ${end}`
}
