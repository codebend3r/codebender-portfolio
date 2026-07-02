import { describe, expect, it } from "vitest"

import { routeFor } from "@utils/routeFor"

describe("routeFor", () => {
  it("returns 'edit' for /edit-resume", () => {
    expect(routeFor("/edit-resume")).toBe("edit")
  })

  it("returns 'app' for the root path", () => {
    expect(routeFor("/")).toBe("app")
  })

  it("returns 'app' for any other path", () => {
    expect(routeFor("/whatever")).toBe("app")
  })
})
