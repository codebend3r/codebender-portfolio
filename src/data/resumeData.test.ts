import { describe, expect, it } from "vitest"

import { resumeData } from "@data/resumeData"

describe("resumeData", () => {
  it("narrows schedule and arrangement on every entry", () => {
    const allTyped = resumeData.work_experience.every(
      (entry) => !!entry.schedule && !!entry.arrangement
    )
    expect(allTyped).toBe(true)
  })

  it("keeps every base field intact", () => {
    expect(resumeData.name).toBe("CJ Rivas")
    expect(resumeData.work_experience.length).toBe(16)
  })
})
