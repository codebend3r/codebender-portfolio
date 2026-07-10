import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import { ResumeDataService } from "@ngapp/services/resume-data.service"

describe("ResumeDataService", () => {
  it("exposes the normalized resume data", () => {
    const service = TestBed.inject(ResumeDataService)

    expect(service.data.name).toBe("CJ Rivas")
    expect(Array.isArray(service.data.contact)).toBe(true)
    expect(service.data.contact.length).toBeGreaterThan(0)
    expect(service.data.work_experience.length).toBeGreaterThan(0)
    expect(service.data.technical_skills.length).toBeGreaterThan(0)
  })

  it("hands out data detached from the JSON module", () => {
    const service = TestBed.inject(ResumeDataService)
    const first = service.data.technical_skills[0]

    service.data.technical_skills[0] = "mutated"
    const fresh = new ResumeDataService()

    expect(fresh.data.technical_skills[0]).toBe(first)
  })
})
