import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useGenerate } from "@generate/useGenerate"

const okBody: GenerateResponse = {
  data: { name: "CJ" } as Data,
  suggestedName: "Frontend @ Acme",
}

function mockFetch(status: number, body: unknown) {
  return vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }))
  )
}

const req: GenerateRequest = {
  password: "p",
  input: { type: "text", text: "posting" },
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useGenerate", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useGenerate())
    expect(result.current.status).toBe("idle")
    expect(result.current.result).toBeNull()
  })

  it("stores the response on success", async () => {
    mockFetch(200, okBody)
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("done")
    expect(result.current.result?.suggestedName).toBe("Frontend @ Acme")
    expect(result.current.error).toBeNull()
  })

  it("surfaces a wrong-password error on 401", async () => {
    mockFetch(401, { error: "unauthorized" })
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("error")
    expect(result.current.error).toMatch(/password/i)
  })

  it("surfaces a generic error on 5xx", async () => {
    mockFetch(502, { error: "generation failed" })
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    expect(result.current.status).toBe("error")
    expect(result.current.error).toMatch(/failed/i)
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
    mockFetch(200, okBody)
    const { result } = renderHook(() => useGenerate())
    await act(() => result.current.generate(req))
    act(() => result.current.reset())
    expect(result.current.status).toBe("idle")
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
