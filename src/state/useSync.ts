import { create } from "zustand"

import { supabase } from "@state/supabase"
import { useVariations } from "@state/useVariations"

import { mergeVariations } from "@utils/mergeVariations"

import type { Json, Tables, TablesInsert } from "@app/types/database.types"

type VariationRow = Tables<"resume_variations">

type SyncState = {
  syncing: boolean
  error: string | null
  lastSyncedAt: number | null
  syncNow: () => Promise<void>
}

const rowToVariation = (row: VariationRow): Variation => ({
  id: row.id,
  name: row.name,
  createdAt: Date.parse(row.created_at),
  updatedAt: Date.parse(row.updated_at),
  data: row.data as unknown as Data,
  ...(row.hash === null ? {} : { hash: row.hash }),
  ...(row.source_preview === null ? {} : { sourcePreview: row.source_preview }),
  ...(row.origin === null
    ? {}
    : { origin: row.origin as "manual" | "generated" }),
})

const variationToRow = (v: Variation): TablesInsert<"resume_variations"> => ({
  id: v.id,
  name: v.name,
  data: v.data as unknown as Json,
  hash: v.hash ?? null,
  source_preview: v.sourcePreview ?? null,
  origin: v.origin ?? null,
  created_at: new Date(v.createdAt).toISOString(),
  updated_at: new Date(v.updatedAt).toISOString(),
})

export const useSync = create<SyncState>()((set, get) => ({
  syncing: false,
  error: null,
  lastSyncedAt: null,

  syncNow: async () => {
    if (!supabase || get().syncing) return

    // RLS silently returns zero rows for anonymous requests, which the
    // merge would read as "everything was deleted remotely" — so never
    // sync without a session.
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) return

    set({ syncing: true, error: null })
    try {
      const { data: rows, error: selectError } = await supabase
        .from("resume_variations")
        .select("*")
        .order("created_at", { ascending: true })
      if (selectError) throw new Error(selectError.message)

      const { variations, pendingDeletes } = useVariations.getState()
      const result = mergeVariations(
        variations,
        (rows ?? []).map(rowToVariation),
        pendingDeletes
      )

      // Apply pulled changes even if the push below fails.
      useVariations.getState().applyMerge(result.merged)

      if (result.toPush.length > 0) {
        const { error: upsertError } = await supabase
          .from("resume_variations")
          .upsert(result.toPush.map(variationToRow))
        if (upsertError) throw new Error(upsertError.message)
        useVariations
          .getState()
          .markSynced(
            result.toPush.map((v) => ({ id: v.id, syncedAt: v.updatedAt }))
          )
      }

      if (result.toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("resume_variations")
          .delete()
          .in("id", result.toDelete)
        if (deleteError) throw new Error(deleteError.message)
      }
      useVariations.getState().clearPendingDeletes(pendingDeletes)

      set({ syncing: false, lastSyncedAt: Date.now() })
    } catch (e) {
      set({
        syncing: false,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  },
}))
