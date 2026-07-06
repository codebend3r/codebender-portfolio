import { describe, expect, it } from "vitest"

import { isSynced, mergeVariations } from "@utils/mergeVariations"

const v = (over: Partial<Variation> & { id: string }): Variation => ({
  name: over.id,
  createdAt: 1000,
  updatedAt: 1000,
  data: {} as Data,
  ...over,
})

describe("isSynced", () => {
  it("is false without a syncedAt watermark", () => {
    expect(isSynced(v({ id: "a" }))).toBe(false)
  })

  it("is false when edited after the last sync", () => {
    expect(isSynced(v({ id: "a", updatedAt: 2000, syncedAt: 1000 }))).toBe(
      false
    )
  })

  it("is true when syncedAt matches updatedAt", () => {
    expect(isSynced(v({ id: "a", updatedAt: 2000, syncedAt: 2000 }))).toBe(true)
  })
})

describe("mergeVariations", () => {
  it("returns empty results for empty inputs", () => {
    const result = mergeVariations([], [], [])
    expect(result.merged).toEqual([])
    expect(result.toPush).toEqual([])
    expect(result.toDelete).toEqual([])
  })

  it("keeps never-synced local variations and schedules a push", () => {
    const local = v({ id: "a" })
    const result = mergeVariations([local], [], [])
    expect(result.merged).toEqual([local])
    expect(result.toPush).toEqual([local])
  })

  it("adopts remote-only variations as already synced", () => {
    const remote = v({ id: "r", updatedAt: 5000 })
    const result = mergeVariations([], [remote], [])
    expect(result.merged).toEqual([{ ...remote, syncedAt: 5000 }])
    expect(result.toPush).toEqual([])
  })

  it("prefers the remote copy when it is newer", () => {
    const local = v({ id: "a", name: "Old", updatedAt: 1000, syncedAt: 1000 })
    const remote = v({ id: "a", name: "New", updatedAt: 2000 })
    const result = mergeVariations([local], [remote], [])
    expect(result.merged).toEqual([{ ...remote, syncedAt: 2000 }])
    expect(result.toPush).toEqual([])
  })

  it("prefers the local copy when it is newer and schedules a push", () => {
    const local = v({ id: "a", name: "New", updatedAt: 3000, syncedAt: 1000 })
    const remote = v({ id: "a", name: "Old", updatedAt: 1000 })
    const result = mergeVariations([local], [remote], [])
    expect(result.merged).toEqual([local])
    expect(result.toPush).toEqual([local])
  })

  it("marks equal timestamps as synced without a push", () => {
    const local = v({ id: "a", updatedAt: 2000 })
    const remote = v({ id: "a", updatedAt: 2000 })
    const result = mergeVariations([local], [remote], [])
    expect(result.merged).toEqual([{ ...local, syncedAt: 2000 }])
    expect(result.toPush).toEqual([])
  })

  it("drops local variations that were synced but deleted remotely", () => {
    const local = v({ id: "a", updatedAt: 1000, syncedAt: 1000 })
    const result = mergeVariations([local], [], [])
    expect(result.merged).toEqual([])
    expect(result.toPush).toEqual([])
  })

  it("schedules remote deletion for pending deletes that still exist", () => {
    const remote = v({ id: "gone", updatedAt: 1000 })
    const result = mergeVariations([], [remote], ["gone"])
    expect(result.merged).toEqual([])
    expect(result.toDelete).toEqual(["gone"])
  })

  it("ignores pending deletes with no remote row", () => {
    const result = mergeVariations([], [], ["never-pushed"])
    expect(result.toDelete).toEqual([])
  })
})
