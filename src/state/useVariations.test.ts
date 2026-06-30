import { beforeEach, describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { useVariations } from "@state/useVariations"

const base = () => structuredClone(resume) as Data

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
})

describe("useVariations", () => {
  it("creates a variation and makes it active", () => {
    const id = useVariations.getState().createVariation("Globe", base())
    const state = useVariations.getState()
    expect(state.variations).toHaveLength(1)
    expect(state.variations[0].name).toBe("Globe")
    expect(state.activeId).toBe(id)
  })

  it("deep-clones the data it is given", () => {
    const data = base()
    useVariations.getState().createVariation("X", data)
    data.name = "Mutated After Create"
    expect(useVariations.getState().variations[0].data.name).toBe(resume.name)
  })

  it("renames a variation", () => {
    const id = useVariations.getState().createVariation("Old", base())
    useVariations.getState().renameVariation(id, "New")
    expect(useVariations.getState().variations[0].name).toBe("New")
  })

  it("deletes a variation and clears activeId when it was active", () => {
    const id = useVariations.getState().createVariation("X", base())
    useVariations.getState().deleteVariation(id)
    expect(useVariations.getState().variations).toHaveLength(0)
    expect(useVariations.getState().activeId).toBeNull()
  })

  it("saveActive writes new data into the active variation", () => {
    const id = useVariations.getState().createVariation("X", base())
    const edited = { ...base(), summary: "Edited summary" }
    useVariations.getState().saveActive(edited)
    const v = useVariations.getState().variations.find((x) => x.id === id)!
    expect(v.data.summary).toBe("Edited summary")
  })

  it("persists to localStorage under resume-variations", () => {
    useVariations.getState().createVariation("Persisted", base())
    expect(localStorage.getItem("resume-variations")).toContain("Persisted")
  })
})
