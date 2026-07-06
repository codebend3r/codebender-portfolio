import { create } from "zustand"
import { persist } from "zustand/middleware"

type VariationsState = {
  variations: Variation[]
  activeId: string | null
  // Ids deleted locally that may still have a database row; cleared by sync.
  pendingDeletes: string[]
  createVariation: (name: string, data: Data, meta?: VariationMeta) => string
  renameVariation: (id: string, name: string) => void
  deleteVariation: (id: string) => void
  selectVariation: (id: string | null) => void
  saveActive: (data: Data) => void
  findByHash: (hash: string) => Variation | undefined
  applyMerge: (merged: Variation[]) => void
  markSynced: (entries: { id: string; syncedAt: number }[]) => void
  clearPendingDeletes: (ids: string[]) => void
}

export const useVariations = create<VariationsState>()(
  persist(
    (set, get) => ({
      variations: [],
      activeId: null,
      pendingDeletes: [],

      createVariation: (name, data, meta) => {
        const id = crypto.randomUUID()
        const now = Date.now()
        const variation: Variation = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          data: structuredClone(data),
          ...meta,
        }
        set({ variations: [...get().variations, variation], activeId: id })
        return id
      },

      renameVariation: (id, name) =>
        set({
          variations: get().variations.map((v) =>
            v.id === id ? { ...v, name } : v
          ),
        }),

      deleteVariation: (id) =>
        set({
          variations: get().variations.filter((v) => v.id !== id),
          activeId: get().activeId === id ? null : get().activeId,
          pendingDeletes: [...get().pendingDeletes, id],
        }),

      selectVariation: (id) => set({ activeId: id }),

      saveActive: (data) => {
        const { activeId } = get()
        if (!activeId) return
        set({
          variations: get().variations.map((v) =>
            v.id === activeId
              ? { ...v, data: structuredClone(data), updatedAt: Date.now() }
              : v
          ),
        })
      },

      findByHash: (hash) => get().variations.find((v) => v.hash === hash),

      applyMerge: (merged) =>
        set({
          variations: merged,
          activeId: merged.some((v) => v.id === get().activeId)
            ? get().activeId
            : null,
        }),

      markSynced: (entries) => {
        const byId = new Map(entries.map((e) => [e.id, e.syncedAt]))
        set({
          variations: get().variations.map((v) =>
            byId.has(v.id) ? { ...v, syncedAt: byId.get(v.id) } : v
          ),
        })
      },

      clearPendingDeletes: (ids) =>
        set({
          pendingDeletes: get().pendingDeletes.filter(
            (id) => !ids.includes(id)
          ),
        }),
    }),
    {
      name: "resume-variations",
      partialize: (state) => ({
        variations: state.variations,
        activeId: state.activeId,
        pendingDeletes: state.pendingDeletes,
      }),
    }
  )
)
