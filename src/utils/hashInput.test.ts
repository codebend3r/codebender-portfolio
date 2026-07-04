import { beforeAll, describe, expect, it } from "vitest"

import { hashInput } from "@utils/hashInput"

beforeAll(async () => {
  // jsdom lacks crypto.subtle; use Node's webcrypto implementation
  if (!globalThis.crypto?.subtle) {
    const { webcrypto } = await import("node:crypto")
    Object.defineProperty(globalThis, "crypto", { value: webcrypto })
  }
})

describe("hashInput", () => {
  it("is deterministic for the same text", async () => {
    const a = await hashInput({ type: "text", text: "senior frontend role" })
    const b = await hashInput({ type: "text", text: "senior frontend role" })
    expect(a).toBe(b)
  })

  it("normalizes surrounding whitespace in text", async () => {
    const a = await hashInput({ type: "text", text: "  posting  " })
    const b = await hashInput({ type: "text", text: "posting" })
    expect(a).toBe(b)
  })

  it("returns a 12-char lowercase hex id", async () => {
    const h = await hashInput({ type: "text", text: "x" })
    expect(h).toMatch(/^[0-9a-f]{12}$/)
  })

  it("differs across different inputs", async () => {
    const a = await hashInput({ type: "text", text: "one" })
    const b = await hashInput({ type: "text", text: "two" })
    expect(a).not.toBe(b)
  })

  it("hashes image inputs on their base64 payload", async () => {
    const img = (data: string): GenerateInput => ({
      type: "image",
      mediaType: "image/png",
      dataBase64: data,
    })
    const a = await hashInput(img("AAAA"))
    const b = await hashInput(img("AAAA"))
    const c = await hashInput(img("BBBB"))
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it("text and image inputs with equal payloads do not collide", async () => {
    const a = await hashInput({ type: "text", text: "AAAA" })
    const b = await hashInput({
      type: "image",
      mediaType: "image/png",
      dataBase64: "AAAA",
    })
    expect(a).not.toBe(b)
  })

  it("is deterministic for the same url", async () => {
    const a = await hashInput({ type: "url", url: "https://jobs.example/a" })
    const b = await hashInput({ type: "url", url: "https://jobs.example/a" })
    expect(a).toBe(b)
  })

  it("url and text inputs with equal payloads do not collide", async () => {
    const a = await hashInput({ type: "text", text: "https://jobs.example/a" })
    const b = await hashInput({ type: "url", url: "https://jobs.example/a" })
    expect(a).not.toBe(b)
  })

  it("differs across different urls", async () => {
    const a = await hashInput({ type: "url", url: "https://jobs.example/a" })
    const b = await hashInput({ type: "url", url: "https://jobs.example/b" })
    expect(a).not.toBe(b)
  })
})
