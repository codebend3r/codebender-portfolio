import { describe, expect, it } from "vitest"

import { slugify } from "@utils/slugify"

describe("slugify", () => {
  it("lowercases and joins words with underscores", () => {
    expect(slugify("Senior Frontend Engineer")).toBe("senior_frontend_engineer")
  })

  it("collapses runs of punctuation into a single underscore", () => {
    expect(slugify("Frontend / Design -- 2026!")).toBe("frontend_design_2026")
  })

  it("trims leading and trailing separators", () => {
    expect(slugify("  (Draft)  ")).toBe("draft")
  })

  it("falls back to 'resume' when nothing survives", () => {
    expect(slugify("!!!")).toBe("resume")
    expect(slugify("")).toBe("resume")
  })

  it("keeps an existing slug untouched", () => {
    expect(slugify("already_a_slug")).toBe("already_a_slug")
  })
})
