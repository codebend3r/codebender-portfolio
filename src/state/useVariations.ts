import { create } from "zustand"
import { persist } from "zustand/middleware"

type VariationsState = {
  variations: Variation[]
  activeId: string | null
  createVariation: (name: string, data: Data) => string
  renameVariation: (id: string, name: string) => void
  deleteVariation: (id: string) => void
  selectVariation: (id: string | null) => void
  saveActive: (data: Data) => void
}

export const useVariations = create<VariationsState>()(
  persist(
    (set, get) => ({
      variations: [],
      activeId: null,

      createVariation: (name, data) => {
        const id = crypto.randomUUID()
        const now = Date.now()
        const variation: Variation = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
          data: structuredClone(data),
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
    }),
    {
      name: "resume-variations",
      partialize: (state) => ({
        variations: state.variations,
        activeId: state.activeId,
      }),
    }
  )
)
