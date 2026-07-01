import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { normalizeData } from "@utils/normalizeData"

describe("normalizeData", () => {
  it("returns data with an array contact untouched", () => {
    const data = structuredClone(resume) as Data
    expect(normalizeData(data)).toBe(data)
  })

  it("converts a legacy object contact into ordered entries", () => {
    const data = {
      ...(structuredClone(resume) as Data),
      contact: {
        email: "a@x.com",
        github: "https://github.com/a",
      } as unknown as ContactEntry[],
    }
    expect(normalizeData(data).contact).toEqual([
      { label: "Email", value: "a@x.com" },
      { label: "GitHub", value: "https://github.com/a" },
    ])
  })
})
