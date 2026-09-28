import { describe, expect, it } from "vitest"

import { isChatEvent, readNdjson } from "./readNdjson"
import type { ChatEvent } from "./readNdjson"

function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

async function collect(
  stream: ReadableStream<Uint8Array>
): Promise<ChatEvent[]> {
  const events: ChatEvent[] = []
  const iterator = readNdjson(stream)[Symbol.asyncIterator]()
  let next = await iterator.next()
  while (!next.done) {
    events.push(next.value)
    next = await iterator.next()
  }
  return events
}

describe("isChatEvent", () => {
  it("accepts a delta event", () => {
    expect(isChatEvent({ type: "delta", text: "hi" })).toBe(true)
  })

  it("accepts a done event with a known stop reason", () => {
    expect(isChatEvent({ type: "done", stop: "end_turn" })).toBe(true)
    expect(isChatEvent({ type: "done", stop: "max_tokens" })).toBe(true)
  })

  it("accepts an error event", () => {
    expect(isChatEvent({ type: "error", message: "oops" })).toBe(true)
  })

  it("rejects a done event with an unknown stop reason", () => {
    expect(isChatEvent({ type: "done", stop: "because" })).toBe(false)
  })

  it("rejects wrong field types", () => {
    expect(isChatEvent({ type: "delta", text: 5 })).toBe(false)
    expect(isChatEvent({ type: "error", message: null })).toBe(false)
  })

  it("rejects unknown types, non-objects, and null", () => {
    expect(isChatEvent({ type: "ping" })).toBe(false)
    expect(isChatEvent("delta")).toBe(false)
    expect(isChatEvent(null)).toBe(false)
    expect(isChatEvent(undefined)).toBe(false)
  })
})

describe("readNdjson", () => {
  it("parses multiple events delivered in one chunk", async () => {
    const events = await collect(
      streamFromChunks([
        '{"type":"delta","text":"a"}\n{"type":"delta","text":"b"}\n',
      ])
    )
    expect(events).toEqual([
      { type: "delta", text: "a" },
      { type: "delta", text: "b" },
    ])
  })

  it("reassembles a line split across chunks", async () => {
    const line = '{"type":"delta","text":"hello world"}\n'
    const events = await collect(
      streamFromChunks([line.slice(0, 10), line.slice(10, 20), line.slice(20)])
    )
    expect(events).toEqual([{ type: "delta", text: "hello world" }])
  })

  it("yields a trailing line with no final newline", async () => {
    const events = await collect(
      streamFromChunks([
        '{"type":"delta","text":"a"}\n{"type":"done","stop":"end_turn"}',
      ])
    )
    expect(events).toEqual([
      { type: "delta", text: "a" },
      { type: "done", stop: "end_turn" },
    ])
  })

  it("skips malformed JSON and well-formed junk without throwing", async () => {
    const events = await collect(
      streamFromChunks([
        "not json at all\n",
        '{"type":"delta","text":"kept"}\n',
        '{"totally":"unrelated"}\n',
        '{"type":"delta"}\n', // missing text field
        "\n", // blank line
      ])
    )
    expect(events).toEqual([{ type: "delta", text: "kept" }])
  })

  it("returns nothing for an empty stream", async () => {
    const events = await collect(streamFromChunks([]))
    expect(events).toEqual([])
  })
})
