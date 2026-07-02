import { describe, expect, it } from "vitest"

import { routeFor } from "@utils/routeFor"

describe("routeFor", () => {
  it("maps /edit-resume to edit", () => {
    expect(routeFor("/edit-resume")).toBe("edit")
  })

  it("maps /generate to generate", () => {
    expect(routeFor("/generate")).toBe("generate")
  })

  it("maps everything else to app", () => {
    expect(routeFor("/")).toBe("app")
    expect(routeFor("/anything")).toBe("app")
    expect(routeFor("/generate/extra")).toBe("app")
  })
})
