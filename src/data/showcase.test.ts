import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

describe("resume.json showcase data", () => {
  it("has eight showcase entries", () => {
    expect(resume.showcase).toHaveLength(8)
  })

  it("each entry has the required fields populated", () => {
    resume.showcase.forEach((item) => {
      expect(item.name).toBeTruthy()
      expect(item.domain).toBeTruthy()
      expect(item.url).toMatch(/^https:\/\//)
      expect(item.role).toBeTruthy()
      expect(item.period).toBeTruthy()
      expect(item.description.length).toBeGreaterThan(20)
      expect(item.image).toMatch(/^\/showcase\/.+\.png$/)
      expect(item.tags.length).toBeGreaterThanOrEqual(2)
    })
  })

  it("every side project links to its GitHub repo", () => {
    const showcase: Showcase[] = resume.showcase
    const sideProjects = showcase.filter((item) =>
      item.role.includes("Side Project")
    )
    expect(sideProjects.length).toBeGreaterThan(0)
    sideProjects.forEach((item) => {
      expect(item.repo).toMatch(/^https:\/\/github\.com\/.+/)
    })
  })
})
