// @vitest-environment node

import { describe, expect, it } from "vitest"

import { visitorKey } from "./visitorKey"

describe("visitorKey", () => {
  it("is stable and deterministic for the same input", () => {
    const a = visitorKey({ ip: "203.0.113.7", salt: "pepper" })
    const b = visitorKey({ ip: "203.0.113.7", salt: "pepper" })
    expect(a).toBe(b)
  })

  it("never contains the raw ip substring", () => {
    const ip = "203.0.113.7"
    const key = visitorKey({ ip, salt: "pepper" })
    expect(key).not.toContain(ip)
  })

  it("produces different output for different salts", () => {
    const a = visitorKey({ ip: "203.0.113.7", salt: "pepper" })
    const b = visitorKey({ ip: "203.0.113.7", salt: "salt2" })
    expect(a).not.toBe(b)
  })

  it("produces different output for different ips", () => {
    const a = visitorKey({ ip: "203.0.113.7", salt: "pepper" })
    const b = visitorKey({ ip: "203.0.113.8", salt: "pepper" })
    expect(a).not.toBe(b)
  })

  it("is a 32-character hex string", () => {
    const key = visitorKey({ ip: "203.0.113.7", salt: "pepper" })
    expect(key).toMatch(/^[0-9a-f]{32}$/)
  })
})
