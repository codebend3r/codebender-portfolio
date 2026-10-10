// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  type ChatUsageStore,
  checkAndCountUsage,
  isUsageCount,
} from "./chatUsage"

function createFakeStore(seed: Record<string, unknown> = {}): ChatUsageStore {
  const data = new Map<string, unknown>(Object.entries(seed))
  return {
    get: (key) => Promise.resolve(data.get(key) ?? null),
    setJSON: (key, value) => {
      data.set(key, value)
      return Promise.resolve(undefined)
    },
  }
}

describe("isUsageCount", () => {
  it("accepts a valid usage count", () => {
    expect(isUsageCount({ count: 3 })).toBe(true)
  })

  it("rejects non-objects", () => {
    expect(isUsageCount(null)).toBe(false)
    expect(isUsageCount("3")).toBe(false)
    expect(isUsageCount(3)).toBe(false)
  })

  it("rejects an object missing count", () => {
    expect(isUsageCount({})).toBe(false)
  })

  it("rejects a non-numeric count", () => {
    expect(isUsageCount({ count: "3" })).toBe(false)
  })
})

describe("checkAndCountUsage", () => {
  it("allows and counts a first request for the day", async () => {
    const store = createFakeStore()
    const result = await checkAndCountUsage({
      store,
      visitorKey: "visitor1",
      day: "2026-09-26",
    })
    expect(result).toEqual({ allowed: true })
    await expect(
      store.get("2026-09-26/visitor1", { type: "json" })
    ).resolves.toEqual({
      count: 1,
    })
    await expect(
      store.get("2026-09-26/global", { type: "json" })
    ).resolves.toEqual({
      count: 1,
    })
  })

  it("increments existing counters", async () => {
    const store = createFakeStore({
      "2026-09-26/visitor1": { count: 5 },
      "2026-09-26/global": { count: 10 },
    })
    await checkAndCountUsage({
      store,
      visitorKey: "visitor1",
      day: "2026-09-26",
    })
    await expect(
      store.get("2026-09-26/visitor1", { type: "json" })
    ).resolves.toEqual({
      count: 6,
    })
    await expect(
      store.get("2026-09-26/global", { type: "json" })
    ).resolves.toEqual({
      count: 11,
    })
  })

  it("blocks once the visitor's daily cap is reached", async () => {
    const store = createFakeStore({ "2026-09-26/visitor1": { count: 30 } })
    const result = await checkAndCountUsage({
      store,
      visitorKey: "visitor1",
      day: "2026-09-26",
    })
    expect(result).toEqual({ allowed: false, reason: "visitor" })
  })

  it("blocks once the global daily cap is reached, even for a fresh visitor", async () => {
    const store = createFakeStore({ "2026-09-26/global": { count: 500 } })
    const result = await checkAndCountUsage({
      store,
      visitorKey: "visitor2",
      day: "2026-09-26",
    })
    expect(result).toEqual({ allowed: false, reason: "global" })
  })

  it("checks the visitor cap before the global cap", async () => {
    const store = createFakeStore({
      "2026-09-26/visitor1": { count: 30 },
      "2026-09-26/global": { count: 500 },
    })
    const result = await checkAndCountUsage({
      store,
      visitorKey: "visitor1",
      day: "2026-09-26",
    })
    expect(result).toEqual({ allowed: false, reason: "visitor" })
  })

  it("keys counters per day, so a new day starts fresh", async () => {
    const store = createFakeStore({ "2026-09-25/visitor1": { count: 30 } })
    const result = await checkAndCountUsage({
      store,
      visitorKey: "visitor1",
      day: "2026-09-26",
    })
    expect(result).toEqual({ allowed: true })
  })
})
