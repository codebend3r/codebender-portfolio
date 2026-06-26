import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

describe("resume.json showcase data", () => {
  it("has four showcase entries", () => {
    expect(resume.showcase).toHaveLength(4)
  })

  it("each entry has the required fields populated", () => {
    for (const item of resume.showcase) {
      expect(item.name).toBeTruthy()
      expect(item.domain).toBeTruthy()
      expect(item.url).toMatch(/^https:\/\//)
      expect(item.role).toBeTruthy()
      expect(item.period).toBeTruthy()
      expect(item.description.length).toBeGreaterThan(20)
      expect(item.image).toMatch(/^\/showcase\/.+\.png$/)
      expect(item.tags.length).toBeGreaterThanOrEqual(2)
    }
  })
})
