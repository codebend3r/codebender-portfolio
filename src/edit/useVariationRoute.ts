import { useEffect, useRef } from "react"

import { cloudConfigured } from "@state/supabase"
import { useSync } from "@state/useSync"
import { useVariations } from "@state/useVariations"

import { editResumePath, routeFor } from "@utils/routeFor"

export type VariationRouteStatus =
  // The path names a variation the store holds, or names none at all.
  | "resolved"
  // Deep-linked id the store has not seen yet — a sync may still deliver it.
  | "pending"
  // Sync settled and the id is nowhere; the link is stale.
  | "missing"

/** Keeps `/edit-resume/:id` and the selected variation pointing at each
 *  other: the path picks the variation on arrival, later selections rewrite
 *  the path, and back/forward re-select. */
export function useVariationRoute(
  variationId: string | null
): VariationRouteStatus {
  const { variations, activeId, selectVariation } = useVariations()
  const { syncing, lastSyncedAt, error } = useSync()

  const known = variations.some((v) => v.id === variationId)

  // First write replaces so upgrading `/edit-resume` to the selected
  // variation's path leaves no dead entry behind the current one.
  const wroteUrl = useRef(false)

  // Each id is applied once, so selecting the base resume afterwards is not
  // immediately undone by the id still sitting in the mount-time path.
  const applied = useRef<string | null>(null)

  // The path wins on arrival — including late, once a sync delivers the
  // variation a deep link named.
  useEffect(() => {
    if (variationId === null || !known) return
    if (applied.current === variationId) return
    applied.current = variationId
    if (activeId !== variationId) selectVariation(variationId)
  }, [variationId, known, activeId, selectVariation])

  // The selection wins from then on: picking a variation rewrites the path.
  useEffect(() => {
    const path = editResumePath(activeId)
    if (window.location.pathname === path) {
      wroteUrl.current = true
      return
    }
    // Hold an unresolved deep link in place; overwriting it would drop the
    // id before the sync that resolves it lands.
    if (variationId !== null && !known && activeId === null) return
    if (wroteUrl.current) window.history.pushState(null, "", path)
    else window.history.replaceState(null, "", path)
    wroteUrl.current = true
  }, [activeId, variationId, known])

  useEffect(() => {
    const onPopState = () => {
      const next = routeFor(window.location.pathname).variationId
      if (next === activeId) return
      // Unknown ids stay unselected rather than clearing the current one.
      if (next !== null && !variations.some((v) => v.id === next)) return
      selectVariation(next)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [activeId, variations, selectVariation])

  if (variationId === null || known) return "resolved"
  const settled = !cloudConfigured || lastSyncedAt !== null || error !== null
  return settled && !syncing ? "missing" : "pending"
}
