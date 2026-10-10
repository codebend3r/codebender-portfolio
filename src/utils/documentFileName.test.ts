import { describe, expect, it } from "vitest"

import { documentFileName } from "@utils/documentFileName"

describe("documentFileName", () => {
  it("joins name and label with a dash", () => {
    expect(
      documentFileName({
        name: "CJ Rivas",
        label: "Senior Frontend Engineer @ Achievers",
        extension: "pdf",
      })
    ).toBe("CJ Rivas - Senior Frontend Engineer @ Achievers.pdf")
  })

  it("appends the docx extension", () => {
    expect(
      documentFileName({ name: "CJ Rivas", label: "Base", extension: "docx" })
    ).toBe("CJ Rivas - Base.docx")
  })

  it("uses the name alone when the label is empty", () => {
    expect(
      documentFileName({ name: "CJ Rivas", label: "", extension: "pdf" })
    ).toBe("CJ Rivas.pdf")
  })

  it("replaces filesystem-illegal characters", () => {
    expect(
      documentFileName({
        name: "CJ Rivas",
        label: 'UI/UX Lead: "Web" <Core>',
        extension: "pdf",
      })
    ).toBe("CJ Rivas - UI-UX Lead- -Web- -Core-.pdf")
  })

  it("collapses surrounding whitespace", () => {
    expect(
      documentFileName({
        name: " CJ Rivas ",
        label: " Frontend @ Acme ",
        extension: "pdf",
      })
    ).toBe("CJ Rivas - Frontend @ Acme.pdf")
  })
})
