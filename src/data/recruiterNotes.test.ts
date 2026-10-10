import { describe, expect, it } from "vitest"

import { isRecruiterNotes, recruiterNotes } from "@data/recruiterNotes"
import baseResume from "@data/resume.json"

import { findOverlaps } from "@utils/employmentOverlaps"

describe("isRecruiterNotes", () => {
  it("accepts the real file shape", () => {
    expect(isRecruiterNotes(recruiterNotes)).toBe(true)
  })

  it("rejects a non-object value", () => {
    expect(isRecruiterNotes(null)).toBe(false)
    expect(isRecruiterNotes("string")).toBe(false)
    expect(isRecruiterNotes(42)).toBe(false)
    expect(isRecruiterNotes([])).toBe(false)
  })

  it("rejects missing overlaps key", () => {
    expect(
      isRecruiterNotes({
        facts: [],
      })
    ).toBe(false)
  })

  it("rejects missing facts key", () => {
    expect(
      isRecruiterNotes({
        overlaps: [],
      })
    ).toBe(false)
  })

  it("rejects extra top-level keys", () => {
    expect(
      isRecruiterNotes({
        overlaps: [],
        facts: [],
        extra: "key",
      })
    ).toBe(false)
  })

  it("rejects overlaps that is not an array", () => {
    expect(
      isRecruiterNotes({
        overlaps: "not an array",
        facts: [],
      })
    ).toBe(false)
  })

  it("rejects facts that is not an array", () => {
    expect(
      isRecruiterNotes({
        overlaps: [],
        facts: "not an array",
      })
    ).toBe(false)
  })

  it("rejects overlap entries missing companies or note", () => {
    expect(
      isRecruiterNotes({
        overlaps: [{ companies: ["A", "B"] }],
        facts: [],
      })
    ).toBe(false)

    expect(
      isRecruiterNotes({
        overlaps: [{ note: "text" }],
        facts: [],
      })
    ).toBe(false)
  })

  it("rejects overlap entries with invalid companies (not exactly 2 strings)", () => {
    expect(
      isRecruiterNotes({
        overlaps: [{ companies: ["A"], note: "text" }],
        facts: [],
      })
    ).toBe(false)

    expect(
      isRecruiterNotes({
        overlaps: [{ companies: ["A", "B", "C"], note: "text" }],
        facts: [],
      })
    ).toBe(false)

    expect(
      isRecruiterNotes({
        overlaps: [{ companies: ["A", 42], note: "text" }],
        facts: [],
      })
    ).toBe(false)

    expect(
      isRecruiterNotes({
        overlaps: [{ companies: "A,B", note: "text" }],
        facts: [],
      })
    ).toBe(false)
  })

  it("rejects overlap entries with non-string note", () => {
    expect(
      isRecruiterNotes({
        overlaps: [{ companies: ["A", "B"], note: 42 }],
        facts: [],
      })
    ).toBe(false)
  })

  it("rejects fact entries missing topic or answer", () => {
    expect(
      isRecruiterNotes({
        overlaps: [],
        facts: [{ topic: "foo" }],
      })
    ).toBe(false)

    expect(
      isRecruiterNotes({
        overlaps: [],
        facts: [{ answer: "bar" }],
      })
    ).toBe(false)
  })

  it("rejects fact entries with non-string topic or answer", () => {
    expect(
      isRecruiterNotes({
        overlaps: [],
        facts: [{ topic: 42, answer: "text" }],
      })
    ).toBe(false)

    expect(
      isRecruiterNotes({
        overlaps: [],
        facts: [{ topic: "text", answer: 42 }],
      })
    ).toBe(false)
  })

  it("accepts well-formed overlaps and facts", () => {
    expect(
      isRecruiterNotes({
        overlaps: [
          { companies: ["CompanyA", "CompanyB"], note: "explanation" },
          { companies: ["X", "Y"], note: "another one" },
        ],
        facts: [
          { topic: "availability", answer: "available now" },
          { topic: "authorization", answer: "yes" },
        ],
      })
    ).toBe(true)
  })
})

describe("recruiterNotes coverage check", () => {
  it("every full-time overlap (2+ months) in the real resume has a matching note in recruiterNotes", () => {
    const overlaps = findOverlaps({
      experience: baseResume.work_experience as Array<{
        role: string
        company: string
        period: string
        schedule?: "full-time" | "part-time"
        achievements: string[]
      }>,
    })

    // Filter to only full-time overlaps (2+ months)
    const fullTimeOverlaps = overlaps.filter(
      (o) => o.kind === "full-time" && o.months >= 2
    )

    // The one full-time overlap this repo ever had (Varicent/Myplanet) was
    // resolved by correcting Varicent's start date in `resume.json` (it was
    // off by a month), turning it into an ordinary one-month handoff — so
    // this loop is expected to be vacuous today. Kept as a live regression
    // check: if a real full-time overlap of 2+ months is ever introduced,
    // this fails until it's covered by a note in `recruiterNotes.json`.
    for (const overlap of fullTimeOverlaps) {
      const hasMatchingNote = recruiterNotes.overlaps.some(
        (note) =>
          (note.companies[0] === overlap.a.company &&
            note.companies[1] === overlap.b.company) ||
          (note.companies[0] === overlap.b.company &&
            note.companies[1] === overlap.a.company)
      )
      expect(hasMatchingNote).toBe(true)
    }
  })
})
