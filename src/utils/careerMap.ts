const PERIOD_PATTERN =
  /^(\d{1,2})\/(\d{4})\s*-\s*(?:(present)|(\d{1,2})\/(\d{4}))$/i

export type PeriodBounds = {
  // Fractional years; `end` is exclusive so a one-month stint has width.
  start: number
  end: number
}

// Turns "09/2024 - 05/2026" or "11/2023 - Present" into fractional-year
// bounds for the career map. Returns null when the period cannot be parsed
// or is empty/backwards.
export function periodBounds({
  period,
  now = new Date(),
}: {
  period: string
  now?: Date
}): PeriodBounds | null {
  const match = period.trim().match(PERIOD_PATTERN)
  if (!match) return null
  const [, startMonth, startYear, present, endMonth, endYear] = match

  const start = Number(startYear) + (Number(startMonth) - 1) / 12
  const end = present
    ? now.getFullYear() + (now.getMonth() + 1) / 12
    : Number(endYear) + Number(endMonth) / 12

  return end > start ? { start, end } : null
}

export type CareerRange = {
  // Whole years; `last` is exclusive, so 2008..2027 spans through 2026.
  first: number
  last: number
}

export function careerRange(
  bounds: readonly PeriodBounds[]
): CareerRange | null {
  if (!bounds.length) return null
  const first = Math.floor(Math.min(...bounds.map((b) => b.start)))
  const last = Math.ceil(Math.max(...bounds.map((b) => b.end)))
  return { first, last }
}

export type CareerBar = {
  leftPct: number
  widthPct: number
}

export function barFor({
  bounds,
  range,
}: {
  bounds: PeriodBounds
  range: CareerRange
}): CareerBar {
  const span = range.last - range.first
  return {
    leftPct: ((bounds.start - range.first) / span) * 100,
    widthPct: ((bounds.end - bounds.start) / span) * 100,
  }
}

export type YearTick = {
  year: number
  leftPct: number
}

export function yearTicks({
  range,
  step = 3,
}: {
  range: CareerRange
  step?: number
}): YearTick[] {
  const span = range.last - range.first
  const count = Math.floor((range.last - 1 - range.first) / step) + 1
  return Array.from({ length: count }, (_, i) => {
    const year = range.first + i * step
    return { year, leftPct: ((year - range.first) / span) * 100 }
  })
}
