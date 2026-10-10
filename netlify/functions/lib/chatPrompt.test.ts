// @vitest-environment node

import { describe, expect, it } from "vitest"

import { recruiterNotes } from "../../../src/data/recruiterNotes"
import { findOverlaps } from "../../../src/utils/employmentOverlaps"
import { baseResume } from "./baseResume"
import { buildChatSystem } from "./chatPrompt"

describe("buildChatSystem", () => {
  it("keeps block 1 byte-identical across different `today` values", () => {
    const [blockA] = buildChatSystem({
      resume: baseResume,
      notes: recruiterNotes,
      today: "2020-01-01",
    })
    const [blockB] = buildChatSystem({
      resume: baseResume,
      notes: recruiterNotes,
      today: "2030-06-15",
    })
    expect(blockA.text).toBe(blockB.text)
  })

  it("marks block 1 with an ephemeral cache_control", () => {
    const [block1] = buildChatSystem({
      resume: baseResume,
      notes: recruiterNotes,
      today: "2026-03-14",
    })
    expect(block1.cache_control).toEqual({ type: "ephemeral" })
  })

  it("puts today's date only in block 2, uncached", () => {
    const [block1, block2] = buildChatSystem({
      resume: baseResume,
      notes: recruiterNotes,
      today: "2026-03-14",
    })
    expect(block2.cache_control).toBeUndefined()
    expect(block2.text).toContain("2026-03-14")
    expect(block1.text).not.toContain("2026-03-14")
  })

  it("contains every work-experience company and its experienceId", () => {
    const [block1] = buildChatSystem({
      resume: baseResume,
      notes: recruiterNotes,
      today: "2026-03-14",
    })
    baseResume.work_experience.forEach((exp) => {
      expect(block1.text).toContain(exp.company)
    })
  })

  it("contains every overlap pair the real resume produces", () => {
    const [block1] = buildChatSystem({
      resume: baseResume,
      notes: recruiterNotes,
      today: "2026-03-14",
    })
    const overlaps = findOverlaps({ experience: baseResume.work_experience })
    overlaps.forEach((overlap) => {
      expect(block1.text).toContain(overlap.a.id)
      expect(block1.text).toContain(overlap.b.id)
    })
  })

  it("contains every owner note (facts and overlaps)", () => {
    const [block1] = buildChatSystem({
      resume: baseResume,
      notes: recruiterNotes,
      today: "2026-03-14",
    })
    recruiterNotes.facts.forEach((fact) => {
      expect(block1.text).toContain(fact.answer)
    })
    recruiterNotes.overlaps.forEach((overlap) => {
      expect(block1.text).toContain(overlap.note)
    })
  })
})
