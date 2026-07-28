import { buildResumeDocument } from "@docx/ResumeDocx"
import type { DocxFont } from "@docx/fonts"
import { Buffer } from "buffer"
import { Packer } from "docx"
import { strFromU8, unzipSync } from "fflate"
import { describe, expect, it } from "vitest"

import { resumeFixture } from "@app/test/resumeFixture"

const logo = Buffer.alloc(64)

async function unzipDocument({
  data = resumeFixture,
  fonts = [],
}: { data?: Data; fonts?: DocxFont[] } = {}) {
  const blob = await Packer.toBlob(buildResumeDocument({ data, fonts, logo }))
  return unzipSync(new Uint8Array(await blob.arrayBuffer()))
}

// The base fixture has a single direct-contact entry (email). This adds a
// phone so the second icon+text path and the separator between them are
// both exercised.
const withPhone: Data = {
  ...resumeFixture,
  contact: [
    ...resumeFixture.contact,
    { label: "Phone", value: "416-555-0123" },
  ],
}

// The run that joins direct-contact entries. Deliberately matched in full:
// the achievement bullet ("•  ") occurs ~90 times in the same document, so
// asserting on the bare "•" would pass even with the separator removed.
const SEPARATOR = "   •   "

describe("buildResumeDocument", () => {
  it("renders every section in the PDF's order", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    const order = [
      resumeFixture.name,
      resumeFixture.title,
      resumeFixture.summary,
      "Technical Skills",
      "Punch Cards",
      "Soft Skills",
      "Analytical Rigor",
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

  it("defaults body runs to the sans with serif display runs", async () => {
    const files = await unzipDocument()
    const stylesXml = strFromU8(files["word/styles.xml"])
    const documentXml = strFromU8(files["word/document.xml"])
    expect(stylesXml.includes("Source Sans 3")).toBe(true) // document default
    expect(documentXml.includes("Source Serif 4")).toBe(true) // name/role runs
  })

  it("renders colour-coded employment values after the company", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    const company = xml.indexOf("Babbage &amp; Co")
    const schedule = xml.indexOf("Full-time")
    const arrangement = xml.indexOf("Permanent")
    expect(company).toBeGreaterThanOrEqual(0)
    expect(schedule).toBeGreaterThan(company)
    expect(arrangement).toBeGreaterThan(schedule)
    expect(xml.includes("2F6DA0")).toBe(true) // full-time blue
    expect(xml.includes("3D7A4F")).toBe(true) // permanent green
  })

  it("links urls and emails in the contact bar", async () => {
    const rels = strFromU8(
      (await unzipDocument())["word/_rels/document.xml.rels"]
    )
    expect(rels.includes("https://ada.dev/")).toBe(true)
    expect(rels.includes("mailto:ada@example.com")).toBe(true)
    expect(rels.includes("London")).toBe(false)
  })

  it("underlines every text hyperlink so they read as links", async () => {
    const xml = strFromU8(
      (await unzipDocument({ data: withPhone }))["word/document.xml"]
    )
    const hyperlinks = xml.match(/<w:hyperlink.*?<\/w:hyperlink>/g) ?? []
    // Icon-only links carry a drawing and no text run; every link that does
    // render text (email, phone) must be underlined.
    const textLinks = hyperlinks.filter((link) => link.includes("<w:t"))
    expect(textLinks).toHaveLength(2)
    expect(textLinks.every((link) => link.includes("<w:u "))).toBe(true)
  })

  it("hides the location entry from the export", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    expect(xml.includes("London")).toBe(false)
  })

  it("embeds an icon image for the site link", async () => {
    const files = await unzipDocument()
    const media = Object.keys(files).filter((f) => f.startsWith("word/media/"))
    expect(media.length).toBeGreaterThan(0)
  })

  it("links a phone number with a tel: href when present", async () => {
    const rels = strFromU8(
      (await unzipDocument({ data: withPhone }))["word/_rels/document.xml.rels"]
    )
    expect(rels.includes("tel:416-555-0123")).toBe(true)
  })

  it("joins multiple direct contact entries with a bullet separator", async () => {
    const xml = strFromU8(
      (await unzipDocument({ data: withPhone }))["word/document.xml"]
    )
    expect(xml.split(SEPARATOR)).toHaveLength(2) // one separator, two halves
  })

  it("omits the separator when only one direct entry remains", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    expect(xml.includes(SEPARATOR)).toBe(false)
  })

  it("right-aligns the web/social icon cluster in the contact bar", async () => {
    const xml = strFromU8((await unzipDocument())["word/document.xml"])
    expect(xml.includes('w:jc w:val="right"')).toBe(true)
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
    const files = await unzipDocument({
      fonts: [{ name: "Source Serif 4", data: Buffer.alloc(64) }],
    })
    expect(
      strFromU8(files["word/fontTable.xml"]).includes("Source Serif 4")
    ).toBe(true)
    expect(Object.keys(files).some((f) => f.endsWith(".odttf"))).toBe(true)
  })
})
