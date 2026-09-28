import { experienceId } from "@utils/experienceId"
import { parsePeriod } from "@utils/period"

type OverlapKind = "part-time" | "handoff" | "full-time"

type OverlapPair = {
  a: { id: string; company: string }
  b: { id: string; company: string }
  months: number
  kind: OverlapKind
}

type Experience = {
  role: string
  company: string
  period: string
  schedule?: "full-time" | "part-time"
  arrangement?: string
  side_project?: boolean
  short?: string
  tags?: string[]
  achievements: string[]
}

type FindOverlapsParams = {
  experience: Experience[]
  now?: Date
}

export function findOverlaps({
  experience,
  now = new Date(),
}: FindOverlapsParams): OverlapPair[] {
  const overlaps: OverlapPair[] = []

  // Parse all periods
  const parsed = experience.map((exp) => ({
    ...exp,
    bounds: parsePeriod({ period: exp.period, now }),
  }))

  // Check all pairs
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      const expA = parsed[i]
      const expB = parsed[j]

      if (!expA.bounds || !expB.bounds) continue

      const { start: startA, end: endA } = expA.bounds
      const { start: startB, end: endB } = expB.bounds

      // Check if periods overlap: min(endA, endB) >= max(startA, startB)
      const overlapStart = Math.max(startA, startB)
      const overlapEnd = Math.min(endA, endB)

      if (overlapEnd < overlapStart) continue // No overlap

      // Calculate shared months (inclusive)
      const sharedMonths = overlapEnd - overlapStart + 1

      // Determine overlap kind
      let kind: OverlapKind = "full-time"

      // Check if either is part-time
      if (expA.schedule === "part-time" || expB.schedule === "part-time") {
        kind = "part-time"
      } else if (sharedMonths === 1) {
        // Both full-time, exactly 1 shared month
        kind = "handoff"
      }
      // else: both full-time, 2+ months -> "full-time"

      overlaps.push({
        a: {
          id: experienceId({ company: expA.company, period: expA.period }),
          company: expA.company,
        },
        b: {
          id: experienceId({ company: expB.company, period: expB.period }),
          company: expB.company,
        },
        months: sharedMonths,
        kind,
      })
    }
  }

  // Sort newest-first by the later of the two periods' start month (descending)
  overlaps.sort((x, y) => {
    const xMaxStart = Math.max(
      parsed[experience.findIndex((e) => e.company === x.a.company)]?.bounds
        ?.start ?? 0,
      parsed[experience.findIndex((e) => e.company === x.b.company)]?.bounds
        ?.start ?? 0
    )
    const yMaxStart = Math.max(
      parsed[experience.findIndex((e) => e.company === y.a.company)]?.bounds
        ?.start ?? 0,
      parsed[experience.findIndex((e) => e.company === y.b.company)]?.bounds
        ?.start ?? 0
    )
    return yMaxStart - xMaxStart
  })

  return overlaps
}
