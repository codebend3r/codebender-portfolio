import { describe, expect, it } from "vitest"

import { pdfFileName } from "@utils/pdfFileName"

describe("pdfFileName", () => {
  it("joins name and label with a dash", () => {
    expect(
      pdfFileName("CJ Rivas", "Senior Frontend Engineer @ Achievers")
    ).toBe("CJ Rivas - Senior Frontend Engineer @ Achievers.pdf")
  })

  it("uses the name alone when the label is empty", () => {
    expect(pdfFileName("CJ Rivas", "")).toBe("CJ Rivas.pdf")
  })

  it("replaces filesystem-illegal characters", () => {
    expect(pdfFileName("CJ Rivas", 'UI/UX Lead: "Web" <Core>')).toBe(
      "CJ Rivas - UI-UX Lead- -Web- -Core-.pdf"
    )
  })

  it("collapses surrounding whitespace", () => {
    expect(pdfFileName(" CJ Rivas ", " Frontend @ Acme ")).toBe(
      "CJ Rivas - Frontend @ Acme.pdf"
    )
  })
})
