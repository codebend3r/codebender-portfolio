import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSync } from "@state/useSync"
import { useVariations } from "@state/useVariations"

const mocks = vi.hoisted(() => {
  type Row = Record<string, unknown>
  const state = {
    session: null as object | null,
    rows: [] as Row[],
    selectError: null as { message: string } | null,
    upserted: [] as Row[][],
    deleted: [] as string[][],
  }

  const from = () => ({
    select: () => ({
      order: async () => ({
        data: state.rows,
        error: state.selectError,
      }),
    }),
    upsert: async (rows: Row[]) => {
      state.upserted.push(rows)
      return { error: null }
    },
    delete: () => ({
      in: async (_column: string, ids: string[]) => {
        state.deleted.push(ids)
        return { error: null }
      },
    }),
  })

  return { state, from }
})

vi.mock("@state/supabase", () => ({
  cloudConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: mocks.state.session } }),
    },
    from: mocks.from,
  },
}))

const remoteRow = (id: string, name: string, updatedAtMs: number) => ({
  id,
  user_id: "user-1",
  name,
  data: { name: "CJ" },
  hash: null,
  source_preview: null,
  origin: null,
  created_at: new Date(1000).toISOString(),
  updated_at: new Date(updatedAtMs).toISOString(),
})

const localVariation = (
  over: Partial<Variation> & { id: string }
): Variation => ({
  name: over.id,
  createdAt: 1000,
  updatedAt: 1000,
  data: {} as Data,
  ...over,
})

beforeEach(() => {
  localStorage.clear()
  mocks.state.session = { user: {} }
  mocks.state.rows = []
  mocks.state.selectError = null
  mocks.state.upserted = []
  mocks.state.deleted = []
  useVariations.setState({ variations: [], activeId: null, pendingDeletes: [] })
  useSync.setState({ syncing: false, error: null, lastSyncedAt: null })
})

describe("useSync", () => {
  it("does nothing while signed out", async () => {
    mocks.state.session = null
    useVariations.setState({ variations: [localVariation({ id: "a" })] })
    await useSync.getState().syncNow()
    expect(mocks.state.upserted).toEqual([])
    expect(useSync.getState().lastSyncedAt).toBeNull()
  })

  it("pulls remote variations into the store as synced", async () => {
    mocks.state.rows = [remoteRow("r1", "Remote", 5000)]
    await useSync.getState().syncNow()
    const v = useVariations.getState().variations.find((x) => x.id === "r1")!
    expect(v.name).toBe("Remote")
    expect(v.updatedAt).toBe(5000)
    expect(v.syncedAt).toBe(5000)
    expect(mocks.state.upserted).toEqual([])
  })

  it("pushes unsynced local variations and marks them synced", async () => {
    useVariations.setState({
      variations: [localVariation({ id: "a", name: "Local", updatedAt: 2000 })],
    })
    await useSync.getState().syncNow()
    expect(mocks.state.upserted).toHaveLength(1)
    expect(mocks.state.upserted[0][0]).toMatchObject({
      id: "a",
      name: "Local",
      updated_at: new Date(2000).toISOString(),
    })
    const v = useVariations.getState().variations[0]
    expect(v.syncedAt).toBe(2000)
    expect(useSync.getState().lastSyncedAt).not.toBeNull()
  })

  it("deletes pending ids that still exist remotely and clears the queue", async () => {
    mocks.state.rows = [remoteRow("gone", "Gone", 1000)]
    useVariations.setState({ pendingDeletes: ["gone", "never-pushed"] })
    await useSync.getState().syncNow()
    expect(mocks.state.deleted).toEqual([["gone"]])
    expect(useVariations.getState().pendingDeletes).toEqual([])
    expect(useVariations.getState().variations).toEqual([])
  })

  it("records an error when the pull fails", async () => {
    mocks.state.selectError = { message: "boom" }
    await useSync.getState().syncNow()
    expect(useSync.getState().error).toBe("boom")
    expect(useSync.getState().syncing).toBe(false)
  })
})
