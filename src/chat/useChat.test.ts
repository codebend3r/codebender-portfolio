import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { useChat } from "./useChat"
import type { ChatAssistantMessage } from "./useChat"

beforeAll(async () => {
  // jsdom lacks crypto.randomUUID; use Node's webcrypto implementation
  // (same fix as src/generate/useGenerate.test.ts).
  if (!globalThis.crypto?.randomUUID) {
    const { webcrypto } = await import("node:crypto")
    Object.defineProperty(globalThis, "crypto", { value: webcrypto })
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

function mockStreamFetch(chunks: string[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      body: streamFromChunks(chunks),
    }))
  )
}

function mockErrorFetch(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: false,
      status,
      body: null,
      json: async () => ({ error: "nope" }),
    }))
  )
}

function mockRejectingFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch")
    })
  )
}

// A fetch whose response stream never closes on its own — enqueues one
// chunk, then only errors (simulating an aborted network read) once the
// passed AbortSignal fires, the way a real aborted fetch tears down its body.
function mockAbortableFetch(firstChunk: string) {
  let streamController: ReadableStreamDefaultController<Uint8Array> | null =
    null
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
      controller.enqueue(encoder.encode(firstChunk))
    },
  })

  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      init?.signal?.addEventListener("abort", () => {
        const abortError = new Error("Aborted")
        abortError.name = "AbortError"
        streamController?.error(abortError)
      })
      return { ok: true, status: 200, body: stream }
    })
  )
}

function assistantOf(messages: ReturnType<typeof useChat>["messages"]) {
  return messages.find(
    (message): message is ChatAssistantMessage => message.role === "assistant"
  )
}

describe("useChat", () => {
  it("starts idle with no messages", () => {
    const { result } = renderHook(() => useChat())
    expect(result.current.status).toBe("idle")
    expect(result.current.messages).toEqual([])
    expect(result.current.errorMessage).toBeNull()
  })

  it("streams deltas and ends done on the happy path", async () => {
    mockStreamFetch([
      '{"type":"delta","text":"CJ joined"}\n',
      '{"type":"delta","text":" Varicent."}\n',
      '{"type":"done","stop":"end_turn"}\n',
    ])
    const { result } = renderHook(() => useChat())

    await act(() => result.current.send({ text: "Tell me about Varicent" }))

    expect(result.current.status).toBe("idle")
    expect(result.current.errorMessage).toBeNull()
    const user = result.current.messages.find((m) => m.role === "user")
    expect(user).toMatchObject({
      status: "sent",
      text: "Tell me about Varicent",
    })
    const assistant = assistantOf(result.current.messages)
    expect(assistant?.text).toBe("CJ joined Varicent.")
    expect(assistant?.status).toBe("done")
  })

  it("marks the answer truncated on a max_tokens stop", async () => {
    mockStreamFetch([
      '{"type":"delta","text":"Partial"}\n',
      '{"type":"done","stop":"max_tokens"}\n',
    ])
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send({ text: "long question" }))

    expect(assistantOf(result.current.messages)?.status).toBe("truncated")
    expect(result.current.status).toBe("idle")
  })

  it.each([
    [400, "That message couldn't be sent."],
    [
      429,
      "You've reached today's question limit. Reach CJ directly at cj.rivas.dev@gmail.com.",
    ],
    [
      503,
      "The assistant is resting for today. Reach CJ directly at cj.rivas.dev@gmail.com.",
    ],
  ])(
    "maps a %i response to its wire-protocol message",
    async (status, message) => {
      mockErrorFetch(status)
      const { result } = renderHook(() => useChat())
      await act(() => result.current.send({ text: "hello" }))

      expect(result.current.status).toBe("error")
      expect(result.current.errorMessage).toBe(message)
      // The question did reach the server; it's not retryable-as-failed.
      const user = result.current.messages.find((m) => m.role === "user")
      expect(user?.status).toBe("sent")
      expect(assistantOf(result.current.messages)).toBeUndefined()
    }
  )

  it("keeps partial text and records the message when a stream error event arrives", async () => {
    mockStreamFetch([
      '{"type":"delta","text":"CJ worked at"}\n',
      '{"type":"error","message":"upstream fell over"}\n',
    ])
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send({ text: "hi" }))

    const assistant = assistantOf(result.current.messages)
    expect(assistant?.text).toBe("CJ worked at")
    expect(assistant?.status).toBe("error")
    expect(assistant?.errorMessage).toBe("upstream fell over")
    // A mid-stream error is recorded on the message, not as a top-level error.
    expect(result.current.status).toBe("idle")
    expect(result.current.errorMessage).toBeNull()
  })

  it("marks the user message failed when the fetch itself rejects (offline)", async () => {
    mockRejectingFetch()
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send({ text: "hi" }))

    expect(result.current.status).toBe("error")
    expect(result.current.errorMessage).toMatch(/offline/i)
    const user = result.current.messages.find((m) => m.role === "user")
    expect(user?.status).toBe("failed")
    expect(assistantOf(result.current.messages)).toBeUndefined()
  })

  it("stop() aborts the stream, keeps partial text, and marks it stopped", async () => {
    mockAbortableFetch('{"type":"delta","text":"Hello"}\n')
    const { result } = renderHook(() => useChat())

    let sendPromise!: Promise<void>
    act(() => {
      sendPromise = result.current.send({ text: "hi" })
    })

    await waitFor(() => {
      expect(assistantOf(result.current.messages)?.text).toBe("Hello")
    })

    act(() => {
      result.current.stop()
    })

    await act(async () => {
      await sendPromise
    })

    const assistant = assistantOf(result.current.messages)
    expect(assistant?.status).toBe("stopped")
    expect(assistant?.text).toBe("Hello")
    expect(result.current.status).toBe("idle")
  })

  it("ignores send() while already streaming", async () => {
    mockAbortableFetch('{"type":"delta","text":"Hello"}\n')
    const { result } = renderHook(() => useChat())

    let sendPromise!: Promise<void>
    act(() => {
      sendPromise = result.current.send({ text: "first" })
    })
    await waitFor(() => {
      expect(assistantOf(result.current.messages)?.text).toBe("Hello")
    })

    await act(() => result.current.send({ text: "second" }))
    expect(
      result.current.messages.filter((m) => m.role === "user")
    ).toHaveLength(1)

    act(() => {
      result.current.stop()
    })
    await act(async () => {
      await sendPromise
    })
  })

  it("reset() clears the conversation and returns to idle", async () => {
    mockStreamFetch([
      '{"type":"delta","text":"hi"}\n',
      '{"type":"done","stop":"end_turn"}\n',
    ])
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send({ text: "hello" }))
    expect(result.current.messages.length).toBeGreaterThan(0)

    act(() => result.current.reset())
    expect(result.current.messages).toEqual([])
    expect(result.current.status).toBe("idle")
    expect(result.current.errorMessage).toBeNull()
  })

  it("retry() resends the last user message, replacing what followed it", async () => {
    mockErrorFetch(503)
    const { result } = renderHook(() => useChat())
    await act(() => result.current.send({ text: "hello" }))
    expect(result.current.status).toBe("error")

    mockStreamFetch([
      '{"type":"delta","text":"hi there"}\n',
      '{"type":"done","stop":"end_turn"}\n',
    ])
    await act(() => result.current.retry())

    expect(result.current.status).toBe("idle")
    const users = result.current.messages.filter((m) => m.role === "user")
    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({ text: "hello", status: "sent" })
    expect(assistantOf(result.current.messages)?.text).toBe("hi there")
  })
})
