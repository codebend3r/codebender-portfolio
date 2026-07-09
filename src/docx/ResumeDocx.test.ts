import { buildResumeDocument } from "@docx/ResumeDocx"
import type { DocxFont } from "@docx/fonts"
import { Buffer } from "buffer"
import { Packer } from "docx"
import { strFromU8, unzipSync } from "fflate"
import { describe, expect, it } from "vitest"

import { resumeFixture } from "@app/test/resumeFixture"

async function unzipDocument(fonts: DocxFont[] = []) {
  const blob = await Packer.toBlob(
    buildResumeDocument({ data: resumeFixture, fonts })
  )
  return unzipSync(new Uint8Array(await blob.arrayBuffer()))
}

describe("buildResumeDocument", () => {
  it("renders every section in the PDF's order", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    const order = [
      resumeFixture.name,
      resumeFixture.title,
      resumeFixture.summary,
      "Technical Skills",
      "Punch Cards",
      "Work Experience",
      "Engine Analyst",
      "Babbage &amp; Co",
      "Wrote the first algorithm",
      "Awards",
      "STEM Pioneer",
    ]
    const positions = order.map((text) => xml.indexOf(text))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    expect(xml.includes("Languages")).toBe(true)
    expect(xml.includes("Education")).toBe(true)
  })

  it("links urls and emails in the contact bar", async () => {
    const rels = strFromU8(
      (await unzipDocument())["word/_rels/document.xml.rels"]
    )
    expect(rels.includes("https://ada.dev/")).toBe(true)
    expect(rels.includes("mailto:ada@example.com")).toBe(true)
    expect(rels.includes("London")).toBe(false)
  })

  it("applies the theme: shading, caps headings, kept-together entries", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    expect(xml.includes("2C4A5C")).toBe(true) // accentDeep fill
    expect(xml.includes("35576B")).toBe(true) // accent color
    expect(xml.includes("w:caps")).toBe(true) // allCaps headings
    expect(xml.includes("w:keepNext")).toBe(true) // wrap={false} equivalent
    expect(xml.includes("Source Serif 4 Semibold")).toBe(true) // company runs
  })

  it("emits a footer with the name and page-number fields", async () => {
    const footer = strFromU8((await unzipDocument())["word/footer1.xml"])
    expect(footer.includes(resumeFixture.name)).toBe(true)
    expect(footer.includes("PAGE")).toBe(true)
    expect(footer.includes("NUMPAGES")).toBe(true)
  })

  it("embeds provided fonts in the font table", async () => {
    const files = await unzipDocument([
      { name: "Source Serif 4", data: Buffer.alloc(64) },
    ])
    expect(
      strFromU8(files["word/fontTable.xml"]).includes("Source Serif 4")
    ).toBe(true)
    expect(Object.keys(files).some((f) => f.endsWith(".odttf"))).toBe(true)
  })
})
