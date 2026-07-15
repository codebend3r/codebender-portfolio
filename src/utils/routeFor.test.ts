import { describe, expect, it } from "vitest"

import { routeFor } from "@utils/routeFor"

describe("routeFor", () => {
  it("maps /edit-resume to edit", () => {
    expect(routeFor("/edit-resume")).toBe("edit")
  })

  it("maps /generate-proximate to generate-proximate", () => {
    expect(routeFor("/generate-proximate")).toBe("generate-proximate")
  })

  it("maps /generate-exact to generate-exact", () => {
    expect(routeFor("/generate-exact")).toBe("generate-exact")
  })

  it("maps /login to login", () => {
    expect(routeFor("/login")).toBe("login")
  })

  it("maps everything else to app", () => {
    expect(routeFor("/")).toBe("app")
    expect(routeFor("/anything")).toBe("app")
    expect(routeFor("/generate")).toBe("app")
    expect(routeFor("/generate-proximate/extra")).toBe("app")
  })
})
