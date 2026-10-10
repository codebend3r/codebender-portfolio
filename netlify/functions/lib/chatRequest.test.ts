// @vitest-environment node

import { describe, expect, it } from "vitest"

import { isChatMessage, parseChatRequest } from "./chatRequest"

function userMsg(content: string) {
  return { role: "user", content }
}
function assistantMsg(content: string) {
  return { role: "assistant", content }
}

// A strictly-alternating conversation that starts AND ends with "user" must
// have an odd length (starting on user, alternation forces every even
// 1-based position to "assistant" and every odd position to "user", so the
// last position is only "user" when the length is odd).
function alternatingConversation({
  count,
  content,
}: {
  count: number
  content: (index: number) => string
}) {
  if (count % 2 === 0) {
    throw new Error("alternatingConversation requires an odd count")
  }
  return Array.from({ length: count }, (_, index) =>
    index % 2 === 0 ? userMsg(content(index)) : assistantMsg(content(index))
  )
}

describe("isChatMessage", () => {
  it("accepts a valid user message", () => {
    expect(isChatMessage(userMsg("hello"))).toBe(true)
  })

  it("rejects a non-object", () => {
    expect(isChatMessage("hello")).toBe(false)
    expect(isChatMessage(null)).toBe(false)
  })

  it("rejects an invalid role", () => {
    expect(isChatMessage({ role: "system", content: "hi" })).toBe(false)
  })

  it("rejects empty content", () => {
    expect(isChatMessage(userMsg(""))).toBe(false)
  })

  it("rejects content over 1000 characters", () => {
    expect(isChatMessage(userMsg("a".repeat(1_001)))).toBe(false)
  })

  it("accepts content at exactly 1000 characters", () => {
    expect(isChatMessage(userMsg("a".repeat(1_000)))).toBe(true)
  })
})

describe("parseChatRequest", () => {
  it("accepts a single user message", () => {
    const result = parseChatRequest({ messages: [userMsg("hi")] })
    expect(result).toEqual([userMsg("hi")])
  })

  it("accepts a strictly alternating conversation starting and ending with user", () => {
    const messages = [
      userMsg("hi"),
      assistantMsg("hello"),
      userMsg("tell me more"),
    ]
    expect(parseChatRequest({ messages })).toEqual(messages)
  })

  it("rejects a non-object body", () => {
    expect(parseChatRequest(null)).toBeNull()
    expect(parseChatRequest("hi")).toBeNull()
    expect(parseChatRequest(42)).toBeNull()
  })

  it("rejects a body without a messages array", () => {
    expect(parseChatRequest({})).toBeNull()
    expect(parseChatRequest({ messages: "hi" })).toBeNull()
  })

  it("rejects an empty messages array", () => {
    expect(parseChatRequest({ messages: [] })).toBeNull()
  })

  it("rejects more than 20 messages", () => {
    const messages = alternatingConversation({
      count: 21,
      content: (i) => `turn${i}`,
    })
    expect(parseChatRequest({ messages })).toBeNull()
  })

  it("accepts 19 messages, the longest valid shape at the 20-message cap", () => {
    // A user-started, user-ended, strictly-alternating conversation must be
    // odd length, so 19 (not 20) is the longest one the 20-message cap admits.
    const messages = alternatingConversation({
      count: 19,
      content: (i) => `turn${i}`,
    })
    expect(messages).toHaveLength(19)
    expect(parseChatRequest({ messages })).toEqual(messages)
  })

  it("rejects a conversation not starting with user", () => {
    const messages = [assistantMsg("hi"), userMsg("hello")]
    expect(parseChatRequest({ messages })).toBeNull()
  })

  it("rejects a conversation not ending with user", () => {
    const messages = [userMsg("hi"), assistantMsg("hello")]
    expect(parseChatRequest({ messages })).toBeNull()
  })

  it("rejects consecutive same-role messages", () => {
    const messages = [userMsg("hi"), userMsg("hello again"), assistantMsg("x")]
    expect(parseChatRequest({ messages })).toBeNull()
  })

  it("rejects a message over the per-message character cap", () => {
    const messages = [userMsg("a".repeat(1_001))]
    expect(parseChatRequest({ messages })).toBeNull()
  })

  it("rejects a conversation over the total character cap", () => {
    // 13 turns of 1000 chars (13,000 total) exceeds the 12,000 cap while
    // staying under the 20-message and 1000-char-per-message caps.
    const messages = alternatingConversation({
      count: 13,
      content: () => "a".repeat(1_000),
    })
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
    expect(totalChars).toBe(13_000)
    expect(parseChatRequest({ messages })).toBeNull()
  })

  it("accepts a conversation right at the total character cap", () => {
    // 11 messages of 1,000 chars plus 2 of 500 chars is 13 messages (a
    // valid odd, user-bounded shape) totaling exactly 12,000 characters.
    const messages = [
      ...alternatingConversation({
        count: 11,
        content: () => "a".repeat(1_000),
      }),
      assistantMsg("b".repeat(500)),
      userMsg("c".repeat(500)),
    ]
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
    expect(totalChars).toBe(12_000)
    expect(parseChatRequest({ messages })).toEqual(messages)
  })
})
