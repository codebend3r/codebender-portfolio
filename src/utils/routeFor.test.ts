import { describe, expect, it } from "vitest"

import { editResumePath, routeFor } from "@utils/routeFor"

describe("routeFor", () => {
  it("maps /edit-resume to edit", () => {
    expect(routeFor("/edit-resume")).toEqual({
      route: "edit",
      variationId: null,
    })
  })

  it("maps /edit-resume/:id to edit with the variation id", () => {
    const id = "9f3a1c2e-4b77-4f0a-8c31-2d5e6a9b0f14"
    expect(routeFor(`/edit-resume/${id}`)).toEqual({
      route: "edit",
      variationId: id,
    })
    expect(routeFor(`/edit-resume/${id}/`)).toEqual({
      route: "edit",
      variationId: id,
    })
  })

  it("decodes an escaped variation id, and survives a malformed escape", () => {
    expect(routeFor("/edit-resume/a%20b").variationId).toBe("a b")
    expect(routeFor("/edit-resume/%").variationId).toBe("%")
  })

  it("maps /generate-proximate to generate-proximate", () => {
    expect(routeFor("/generate-proximate").route).toBe("generate-proximate")
  })

  it("maps /generate-exact to generate-exact", () => {
    expect(routeFor("/generate-exact").route).toBe("generate-exact")
  })

  it("maps /login to login", () => {
    expect(routeFor("/login").route).toBe("login")
  })

  it("maps /angular-version to angular-version, with or without a trailing slash", () => {
    expect(routeFor("/angular-version").route).toBe("angular-version")
    expect(routeFor("/angular-version/").route).toBe("angular-version")
  })

  it("maps everything else to app", () => {
    expect(routeFor("/").route).toBe("app")
    expect(routeFor("/anything").route).toBe("app")
    expect(routeFor("/generate").route).toBe("app")
    expect(routeFor("/generate-proximate/extra").route).toBe("app")
    expect(routeFor("/edit-resume/a/b").route).toBe("app")
  })
})

describe("editResumePath", () => {
  it("returns the bare edit path for the base resume", () => {
    expect(editResumePath(null)).toBe("/edit-resume")
  })

  it("returns a child path for a variation, escaping the id", () => {
    expect(editResumePath("abc")).toBe("/edit-resume/abc")
    expect(editResumePath("a b")).toBe("/edit-resume/a%20b")
  })

  it("round-trips through routeFor", () => {
    const id = "9f3a1c2e-4b77-4f0a-8c31-2d5e6a9b0f14"
    expect(routeFor(editResumePath(id)).variationId).toBe(id)
  })
})
