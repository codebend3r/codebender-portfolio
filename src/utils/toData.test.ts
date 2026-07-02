import { describe, expect, it } from "vitest"

import { toData } from "@utils/toData"

describe("toData", () => {
  it("strips function members and keeps data fields", () => {
    const state = {
      name: "CJ Rivas",
      title: "Senior Frontend Engineer",
      technical_skills: ["React", "TypeScript"],
      loadData: () => {},
      setPath: () => {},
      reorder: () => {},
    } as unknown as ResumeStore

    expect(toData(state)).toEqual({
      name: "CJ Rivas",
      title: "Senior Frontend Engineer",
      technical_skills: ["React", "TypeScript"],
    })
  })

  it("returns an object with no function values", () => {
    const state = {
      name: "CJ",
      addExperience: () => {},
    } as unknown as ResumeStore

    const values = Object.values(toData(state))
    expect(values.some((v) => typeof v === "function")).toBe(false)
  })
})
