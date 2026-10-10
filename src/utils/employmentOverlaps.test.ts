// @vitest-environment node

import { describe, expect, it } from "vitest"

import baseResume from "@data/resume.json"

import { findOverlaps } from "@utils/employmentOverlaps"

describe("findOverlaps", () => {
  it("returns empty array for non-overlapping experiences", () => {
    const experiences: Array<{
      role: string
      company: string
      period: string
      schedule?: "full-time" | "part-time"
      achievements: string[]
    }> = [
      {
        role: "Engineer",
        company: "A",
        period: "01/2010 - 12/2010",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "Engineer",
        company: "B",
        period: "01/2012 - 12/2012",
        schedule: "full-time",
        achievements: [],
      },
    ]
    const result = findOverlaps({ experience: experiences })
    expect(result).toEqual([])
  })

  it("classifies part-time overlaps correctly", () => {
    const experiences: Array<{
      role: string
      company: string
      period: string
      schedule?: "full-time" | "part-time"
      achievements: string[]
    }> = [
      {
        role: "Full-time",
        company: "Full-time Inc.",
        period: "01/2020 - 12/2020",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "Part-time",
        company: "Part-time Co.",
        period: "06/2020 - 12/2021",
        schedule: "part-time",
        achievements: [],
      },
    ]
    const result = findOverlaps({ experience: experiences })
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe("part-time")
    expect(result[0].months).toBe(7) // Jun-Dec 2020 = 7 months
  })

  it("classifies handoff overlaps (exactly 1 month) correctly", () => {
    const experiences: Array<{
      role: string
      company: string
      period: string
      schedule?: "full-time" | "part-time"
      achievements: string[]
    }> = [
      {
        role: "Engineer",
        company: "First",
        period: "01/2020 - 05/2020",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "Engineer",
        company: "Second",
        period: "05/2020 - 12/2020",
        schedule: "full-time",
        achievements: [],
      },
    ]
    const result = findOverlaps({ experience: experiences })
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe("handoff")
    expect(result[0].months).toBe(1)
  })

  it("classifies full-time overlaps (2+ months) correctly", () => {
    const experiences: Array<{
      role: string
      company: string
      period: string
      schedule?: "full-time" | "part-time"
      achievements: string[]
    }> = [
      {
        role: "Engineer",
        company: "First",
        period: "01/2020 - 06/2020",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "Engineer",
        company: "Second",
        period: "05/2020 - 12/2020",
        schedule: "full-time",
        achievements: [],
      },
    ]
    const result = findOverlaps({ experience: experiences })
    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe("full-time")
    expect(result[0].months).toBe(2) // May and June
  })

  it("sorts overlaps newest-first by the later start month", () => {
    const experiences: Array<{
      role: string
      company: string
      period: string
      schedule?: "full-time" | "part-time"
      achievements: string[]
    }> = [
      {
        role: "A",
        company: "A",
        period: "01/2015 - 06/2015",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "B",
        company: "B",
        period: "05/2015 - 12/2015",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "C",
        company: "C",
        period: "01/2020 - 06/2020",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "D",
        company: "D",
        period: "05/2020 - 12/2020",
        schedule: "full-time",
        achievements: [],
      },
    ]
    const result = findOverlaps({ experience: experiences })
    expect(result).toHaveLength(2)
    // C/D should come first (start in 2020), then A/B (start in 2015)
    expect(result[0].a.company).toBe("C")
    expect(result[1].a.company).toBe("A")
  })

  it("includes both (a, b) and reverses for duplicate ordering", () => {
    const experiences: Array<{
      role: string
      company: string
      period: string
      schedule?: "full-time" | "part-time"
      achievements: string[]
    }> = [
      {
        role: "First",
        company: "First Inc.",
        period: "01/2020 - 12/2020",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "Second",
        company: "Second Ltd.",
        period: "06/2020 - 12/2021",
        schedule: "full-time",
        achievements: [],
      },
    ]
    const result = findOverlaps({ experience: experiences })
    expect(result).toHaveLength(1)
    const [overlap] = result
    expect(overlap.a.company).toBe("First Inc.")
    expect(overlap.b.company).toBe("Second Ltd.")
  })

  it("matches expected overlaps from real resume.json", () => {
    const result = findOverlaps({
      experience: baseResume.work_experience as Array<{
        role: string
        company: string
        period: string
        schedule?: "full-time" | "part-time"
        achievements: string[]
      }>,
    })

    // Verify we have overlaps
    expect(result.length).toBeGreaterThan(0)

    // Verify overlap kinds exist. There is no "full-time" (2+ month) overlap
    // in the real resume today — Varicent's start date was corrected to
    // 02/2021 (from an off-by-one-month 01/2021), turning what used to be a
    // 2-month full-time overlap with Myplanet into an ordinary same-month
    // handoff, matching every other role transition in the resume.
    const kinds = new Set(result.map((o) => o.kind))
    expect(kinds.has("part-time")).toBe(true)
    expect(kinds.has("handoff")).toBe(true)
    expect(kinds.has("full-time")).toBe(false)

    const varMyplanetOverlap = result.find(
      (o) =>
        (o.a.company === "Varicent" && o.b.company === "Myplanet") ||
        (o.a.company === "Myplanet" && o.b.company === "Varicent")
    )
    expect(varMyplanetOverlap).toBeDefined()
    expect(varMyplanetOverlap?.kind).toBe("handoff")
    expect(varMyplanetOverlap?.months).toBe(1)

    // Verify Codebender (part-time) overlaps with many
    const codebenderOverlaps = result.filter(
      (o) =>
        o.a.company === "Codebender Inc." || o.b.company === "Codebender Inc."
    )
    expect(codebenderOverlaps.length).toBeGreaterThan(1)
    expect(codebenderOverlaps.every((o) => o.kind === "part-time")).toBe(true)

    // Verify handoff pairs exist (same-month transitions)
    const handoffPairs = result.filter((o) => o.kind === "handoff")
    expect(handoffPairs.length).toBeGreaterThan(0)
  })

  it("uses correct order for overlap pair (a/b)", () => {
    const result = findOverlaps({
      experience: baseResume.work_experience as Array<{
        role: string
        company: string
        period: string
        schedule?: "full-time" | "part-time"
        achievements: string[]
      }>,
    })
    for (const overlap of result) {
      expect(overlap.a).toBeDefined()
      expect(overlap.a.id).toBeDefined()
      expect(overlap.a.company).toBeDefined()
      expect(overlap.b).toBeDefined()
      expect(overlap.b.id).toBeDefined()
      expect(overlap.b.company).toBeDefined()
      expect(overlap.months).toBeGreaterThan(0)
      expect(["part-time", "handoff", "full-time"]).toContain(overlap.kind)
    }
  })

  it("handles Present-ended periods correctly", () => {
    const now = new Date(2026, 6, 1) // July 2026
    const experiences: Array<{
      role: string
      company: string
      period: string
      schedule?: "full-time" | "part-time"
      achievements: string[]
    }> = [
      {
        role: "Current",
        company: "Current Co.",
        period: "01/2025 - Present",
        schedule: "full-time",
        achievements: [],
      },
      {
        role: "Other",
        company: "Other Inc.",
        period: "06/2025 - 12/2025",
        schedule: "full-time",
        achievements: [],
      },
    ]
    const result = findOverlaps({ experience: experiences, now })
    expect(result).toHaveLength(1)
    expect(result[0].months).toBe(7) // Jun-Dec 2025
  })
})
