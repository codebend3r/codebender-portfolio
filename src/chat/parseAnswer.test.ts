import { describe, expect, it } from "vitest"

import { parseAnswer } from "./parseAnswer"

const KNOWN_IDS = new Set([
  "codebender_inc_2011",
  "ipolitics_2023",
  "the_globe_and_mail_2024",
  "xp_ventures_labs_2024",
  "radian_2022",
  "varicent_2021",
  "myplanet_2020",
])

// Verbatim from the bot design doc's "Example: raw model output vs.
// rendered" section.
const RAW_EXAMPLE = `Most of the overlap comes from two part-time roles that ran alongside full-time work:
- Codebender Inc. is CJ's own consultancy, part-time since 01/2011. [[exp:codebender_inc_2011]]
- iPolitics was a part-time contract from 11/2023 to 07/2026. [[exp:ipolitics_2023]]

The rest are one-month handoffs. The resume lists dates by month, so a role that ended in the same month the next one started looks like an overlap.

[[timeline:codebender_inc_2011,ipolitics_2023,the_globe_and_mail_2024,xp_ventures_labs_2024,radian_2022,varicent_2021,myplanet_2020]]

The one longer overlap is Myplanet and Varicent in 01/2021 and 02/2021, both full-time. [[exp:myplanet_2020]] [[exp:varicent_2021]] I don't have details on that one, so it's best to ask CJ directly at cj.rivas.dev@gmail.com.`

describe("parseAnswer: worked example", () => {
  it("dedupes source ids in first-seen order across the whole answer", () => {
    const result = parseAnswer({
      text: RAW_EXAMPLE,
      knownIds: KNOWN_IDS,
      streaming: false,
    })
    expect(result.sourceIds).toEqual([
      "codebender_inc_2011",
      "ipolitics_2023",
      "myplanet_2020",
      "varicent_2021",
    ])
  })

  it("renders a timeline block in place with all known ids, in order", () => {
    const result = parseAnswer({
      text: RAW_EXAMPLE,
      knownIds: KNOWN_IDS,
      streaming: false,
    })
    const timelineBlocks = result.blocks.filter(
      (block) => block.type === "timeline"
    )
    expect(timelineBlocks).toHaveLength(1)
    expect(timelineBlocks[0]).toEqual({
      type: "timeline",
      ids: [
        "codebender_inc_2011",
        "ipolitics_2023",
        "the_globe_and_mail_2024",
        "xp_ventures_labs_2024",
        "radian_2022",
        "varicent_2021",
        "myplanet_2020",
      ],
    })
  })

  it("strips every marker from the rendered text", () => {
    const result = parseAnswer({
      text: RAW_EXAMPLE,
      knownIds: KNOWN_IDS,
      streaming: false,
    })
    const rendered = result.blocks
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
    expect(rendered).not.toContain("[[")
    expect(rendered).not.toContain("]]")
    expect(rendered).toContain("cj.rivas.dev@gmail.com")
  })
})

describe("parseAnswer: unknown ids", () => {
  it("drops an unknown exp id from both text and sources", () => {
    const result = parseAnswer({
      text: "CJ did a thing. [[exp:unknown_2099]]",
      knownIds: KNOWN_IDS,
      streaming: false,
    })
    expect(result.sourceIds).toEqual([])
    expect(result.blocks).toEqual([{ type: "text", text: "CJ did a thing." }])
  })
})

describe("parseAnswer: timeline with too few known ids", () => {
  it("drops the timeline block entirely when fewer than 2 known ids remain", () => {
    const result = parseAnswer({
      text: "Some intro.\n[[timeline:unknown_a,unknown_b,myplanet_2020]]\nSome outro.",
      knownIds: KNOWN_IDS,
      streaming: false,
    })
    expect(result.blocks.some((block) => block.type === "timeline")).toBe(false)
    expect(result.blocks).toEqual([
      { type: "text", text: "Some intro.\nSome outro." },
    ])
  })

  it("keeps the timeline block when exactly 2 known ids remain", () => {
    const result = parseAnswer({
      text: "[[timeline:unknown_a,myplanet_2020,varicent_2021]]",
      knownIds: KNOWN_IDS,
      streaming: false,
    })
    expect(result.blocks).toEqual([
      { type: "timeline", ids: ["myplanet_2020", "varicent_2021"] },
    ])
  })

  it("does not count timeline ids as sources", () => {
    const result = parseAnswer({
      text: "[[timeline:myplanet_2020,varicent_2021]]",
      knownIds: KNOWN_IDS,
      streaming: false,
    })
    expect(result.sourceIds).toEqual([])
  })
})

describe("parseAnswer: streaming hold-back", () => {
  it("never renders a marker split across simulated stream chunks", () => {
    const full = "CJ led the project. [[exp:myplanet_2020]] and more."
    const deltas = full.match(/.{1,3}/g) ?? [full]

    let accumulated = ""
    const snapshots = deltas.map((delta) => {
      accumulated += delta
      return parseAnswer({
        text: accumulated,
        knownIds: KNOWN_IDS,
        streaming: true,
      })
    })

    snapshots.forEach((snapshot) => {
      const rendered = snapshot.blocks
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("\n")
      expect(rendered).not.toMatch(/\[\[exp:myplanet_2020(?!]])/)
      expect(rendered).not.toContain("[[exp:myplanet_2020]]")
    })

    const final = snapshots[snapshots.length - 1]
    expect(final.sourceIds).toEqual(["myplanet_2020"])
    expect(
      final.blocks.map((block) => (block.type === "text" ? block.text : ""))
    ).toEqual(["CJ led the project.  and more."])
  })

  it("holds back an unclosed [[ while under the 64-character limit", () => {
    const text = "Answer so far [[exp:partial"
    const result = parseAnswer({ text, knownIds: KNOWN_IDS, streaming: true })
    expect(result.blocks).toEqual([{ type: "text", text: "Answer so far" }])
  })

  it("flushes an unclosed [[ as literal text once 64 characters pass", () => {
    const tail = "[[exp:" + "x".repeat(70)
    const text = `Answer so far ${tail}`
    const result = parseAnswer({ text, knownIds: KNOWN_IDS, streaming: true })
    expect(result.blocks).toEqual([{ type: "text", text }])
  })

  it("always flushes an unclosed [[ on a final (non-streaming) parse", () => {
    const text = "Answer so far [[exp:partial"
    const result = parseAnswer({ text, knownIds: KNOWN_IDS, streaming: false })
    expect(result.blocks).toEqual([{ type: "text", text }])
  })
})
