import { generateResumeDocx } from "@docx/generateDocx"
import { describe, expect, it, vi } from "vitest"

import { resumeFixture } from "@app/test/resumeFixture"

vi.mock("@docx/fonts", () => ({
  loadDocxFonts: vi.fn().mockResolvedValue([]),
}))

describe("generateResumeDocx", () => {
  it("resolves to a non-empty .docx blob", async () => {
    const blob = await generateResumeDocx(resumeFixture)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
  })
})
