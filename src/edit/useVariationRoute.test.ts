import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { useVariationRoute } from "@edit/useVariationRoute"

import { useSync } from "@state/useSync"
import { useVariations } from "@state/useVariations"

const variation = (id: string, name: string): Variation => ({
  id,
  name,
  createdAt: 0,
  updatedAt: 0,
  data: {} as Data,
})

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null, pendingDeletes: [] })
  useSync.setState({ syncing: false, error: null, lastSyncedAt: null })
  window.history.replaceState(null, "", "/edit-resume")
})

describe("useVariationRoute", () => {
  it("selects the variation the path names", () => {
    useVariations.setState({ variations: [variation("v-1", "Globe")] })

    const { result } = renderHook(() => useVariationRoute("v-1"))

    expect(useVariations.getState().activeId).toBe("v-1")
    expect(result.current).toBe("resolved")
  })

  it("writes the selection into the path", () => {
    useVariations.setState({ variations: [variation("v-1", "Globe")] })
    const { rerender } = renderHook(() => useVariationRoute(null))
    expect(window.location.pathname).toBe("/edit-resume")

    act(() => {
      useVariations.getState().selectVariation("v-1")
    })
    rerender()

    expect(window.location.pathname).toBe("/edit-resume/v-1")
  })

  it("returns to the bare path when the base resume is selected", () => {
    useVariations.setState({
      variations: [variation("v-1", "Globe")],
      activeId: "v-1",
    })
    const { rerender } = renderHook(() => useVariationRoute("v-1"))
    expect(window.location.pathname).toBe("/edit-resume/v-1")

    act(() => {
      useVariations.getState().selectVariation(null)
    })
    rerender()

    expect(window.location.pathname).toBe("/edit-resume")
  })

  it("holds an unresolved deep link until a sync delivers it", () => {
    window.history.replaceState(null, "", "/edit-resume/v-1")
    const { result, rerender } = renderHook(() => useVariationRoute("v-1"))

    expect(result.current).toBe("pending")
    expect(window.location.pathname).toBe("/edit-resume/v-1")
    expect(useVariations.getState().activeId).toBeNull()

    act(() => {
      useVariations.setState({ variations: [variation("v-1", "Globe")] })
    })
    rerender()

    expect(useVariations.getState().activeId).toBe("v-1")
    expect(result.current).toBe("resolved")
  })

  it("reports a stale link once the sync has settled", () => {
    window.history.replaceState(null, "", "/edit-resume/gone")
    useSync.setState({ lastSyncedAt: 1 })

    const { result } = renderHook(() => useVariationRoute("gone"))

    expect(result.current).toBe("missing")
    expect(useVariations.getState().activeId).toBeNull()
  })

  it("re-selects on back and forward navigation", () => {
    useVariations.setState({
      variations: [variation("v-1", "Globe")],
      activeId: "v-1",
    })
    const { rerender } = renderHook(() => useVariationRoute("v-1"))

    window.history.replaceState(null, "", "/edit-resume")
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"))
    })
    rerender()
    expect(useVariations.getState().activeId).toBeNull()

    window.history.replaceState(null, "", "/edit-resume/v-1")
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"))
    })
    rerender()
    expect(useVariations.getState().activeId).toBe("v-1")
  })

  it("ignores a popstate that names an unknown variation", () => {
    useVariations.setState({
      variations: [variation("v-1", "Globe")],
      activeId: "v-1",
    })
    renderHook(() => useVariationRoute("v-1"))

    window.history.replaceState(null, "", "/edit-resume/gone")
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"))
    })

    expect(useVariations.getState().activeId).toBe("v-1")
  })
})
