// @vitest-environment node

import { describe, expect, it } from "vitest"

import { isChatStopReason, toChatStopReason } from "./chatStopReason"

const KNOWN_REASONS = [
  "end_turn",
  "max_tokens",
  "stop_sequence",
  "tool_use",
  "pause_turn",
  "refusal",
  "model_context_window_exceeded",
]

describe("isChatStopReason", () => {
  it.each(KNOWN_REASONS)("accepts %s", (reason) => {
    expect(isChatStopReason(reason)).toBe(true)
  })

  it("rejects compaction, a BetaStopReason this endpoint never produces", () => {
    expect(isChatStopReason("compaction")).toBe(false)
  })

  it("rejects null and non-strings", () => {
    expect(isChatStopReason(null)).toBe(false)
    expect(isChatStopReason(42)).toBe(false)
  })
})

describe("toChatStopReason", () => {
  it.each(KNOWN_REASONS)("passes %s through unchanged", (reason) => {
    expect(toChatStopReason(reason)).toBe(reason)
  })

  it("falls back to end_turn for compaction", () => {
    expect(toChatStopReason("compaction")).toBe("end_turn")
  })

  it("falls back to end_turn for null", () => {
    expect(toChatStopReason(null)).toBe("end_turn")
  })
})
