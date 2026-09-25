import { describe, expect, it } from "vitest"

import { isSideProjectShowcase } from "@utils/showcase"

const base: Showcase = {
  name: "Thing",
  domain: "thing.dev",
  url: "https://thing.dev",
  role: "Builder",
  period: "2024",
  description: "A thing.",
  image: "/showcase/thing.png",
  tags: ["TypeScript"],
}

describe("isSideProjectShowcase", () => {
  it("treats entries with a repo as side projects", () => {
    expect(
      isSideProjectShowcase({ ...base, repo: "https://github.com/x/thing" })
    ).toBe(true)
  })

  it("treats entries without a repo as client work", () => {
    expect(isSideProjectShowcase(base)).toBe(false)
    expect(isSideProjectShowcase({ ...base, repo: "" })).toBe(false)
  })
})
