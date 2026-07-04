import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { useGenerate } from "@generate/useGenerate"

const okBody: GenerateResponse = {
  data: { name: "CJ" } as Data,
  suggestedName: "Frontend @ Acme",
}

beforeAll(async () => {
  // jsdom lacks crypto.randomUUID; use Node's webcrypto implementation
  if (!globalThis.crypto?.randomUUID) {
    const { webcrypto } = await import("node:crypto")
    Object.defineProperty(globalThis, "crypto", { value: webcrypto })
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

type FetchCall = { url: string; init?: RequestInit }

/**
 * Stub fetch with a 202 kickoff plus a queue of poll responses (one per
 * /generate-status call; the last entry repeats).
 */
function mockJobFetch(polls: Array<{ status?: number; body: unknown }>) {
  const calls: FetchCall[] = []
  let pollIndex = 0
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.includes("generate-status")) {
        const poll = polls[Math.min(pollIndex++, polls.length - 1)]
        return {
          ok: (poll.status ?? 200) < 400,
          status: poll.status ?? 200,
          json: async () => poll.body,
        }
      }
      return { ok: true, status: 202, json: async () => ({}) }
    })
  )
  return calls
}

const req: GenerateRequest = {
  password: "p",
  input: { type: "text", text: "posting" },
}

describe("useGenerate", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useGenerate())
    expect(result.current.status).toBe("idle")
    expect(result.current.result).toBeNull()
  })

  it("POSTs the request with a minted jobId and polls to done", async () => {
    const calls = mockJobFetch([{ body: { status: "done", ...okBody } }])
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))

    expect(result.current.status).toBe("done")
    expect(result.current.result?.suggestedName).toBe("Frontend @ Acme")
    expect(result.current.error).toBeNull()

    const post = calls[0]
    const body = JSON.parse(String(post.init?.body)) as GenerateJobRequest
    expect(body.jobId).toMatch(/^[0-9a-f-]{36}$/)
    expect(body.input).toEqual(req.input)
    expect(calls[1].url).toContain(`generate-status?id=${body.jobId}`)
  })

  it("keeps polling through pending states", async () => {
    vi.useFakeTimers()
    mockJobFetch([
      { body: { status: "pending" } },
      { body: { status: "pending" } },
      { body: { status: "done", ...okBody } },
    ])
    const { result } = renderHook(() => useGenerate())
    let done!: Promise<void>
    act(() => {
      done = result.current.generate(req)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
      await done
    })
    expect(result.current.status).toBe("done")
  })

  it("surfaces the job error verbatim (e.g. wrong password)", async () => {
    mockJobFetch([{ body: { status: "error", error: "wrong password" } }])
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("error")
    expect(result.current.error).toMatch(/wrong password/i)
  })

  it("errors when the kickoff POST is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 400, json: async () => ({}) }))
    )
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("error")
    expect(result.current.error).toMatch(/could not start/i)
  })

  it("times out after polling too long", async () => {
    vi.useFakeTimers()
    mockJobFetch([{ body: { status: "pending" } }])
    const { result } = renderHook(() => useGenerate())
    let done!: Promise<void>
    act(() => {
      done = result.current.generate(req)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300_000)
      await done
    })
    expect(result.current.status).toBe("error")
    expect(result.current.error).toMatch(/timed out/i)
  })

  it("surfaces a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline")
      })
    )
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("error")
  })

  it("reset returns to idle", async () => {
    mockJobFetch([{ body: { status: "done", ...okBody } }])
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    act(() => result.current.reset())
    expect(result.current.status).toBe("idle")
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
