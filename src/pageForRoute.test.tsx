import type { ReactElement } from "react"
import { isValidElement } from "react"

import { describe, expect, it } from "vitest"

import { AuthGate } from "@components/AuthGate"
import { LoginPage } from "@components/LoginPage"

import EditResumeApp from "@edit/EditResumeApp"

import GenerateApp from "@generate/GenerateApp"

import App from "@App"
import { pageForRoute } from "@app/pageForRoute"

// Pulls the single child element out of a wrapper without rendering it.
function childElement(el: ReactElement): ReactElement | null {
  const props: unknown = el.props
  if (typeof props !== "object" || props === null) return null
  if (!("children" in props)) return null
  const child = props.children
  if (typeof child !== "object" || child === null) return null
  return isValidElement(child) ? child : null
}

describe("pageForRoute", () => {
  it("wraps the edit page in an auth gate", () => {
    const page = pageForRoute({ route: "edit", variationId: null })
    expect(page.type).toBe(AuthGate)
    const child = childElement(page)
    expect(child?.type ?? null).toBe(EditResumeApp)
    expect(child?.props ?? null).toMatchObject({ variationId: null })
  })

  it("hands the edit page the variation id from the path", () => {
    const page = pageForRoute({ route: "edit", variationId: "v-1" })
    expect(childElement(page)?.props ?? null).toMatchObject({
      variationId: "v-1",
    })
  })

  it("wraps the proximate generate page in an auth gate", () => {
    const page = pageForRoute({
      route: "generate-proximate",
      variationId: null,
    })
    expect(page.type).toBe(AuthGate)
    const child = childElement(page)
    expect(child?.type ?? null).toBe(GenerateApp)
    expect(child?.props ?? null).toMatchObject({ mode: "proximate" })
  })

  it("wraps the exact generate page in an auth gate", () => {
    const page = pageForRoute({ route: "generate-exact", variationId: null })
    expect(page.type).toBe(AuthGate)
    const child = childElement(page)
    expect(child?.type ?? null).toBe(GenerateApp)
    expect(child?.props ?? null).toMatchObject({ mode: "exact" })
  })

  it("renders the login page without an auth gate", () => {
    expect(pageForRoute({ route: "login", variationId: null }).type).toBe(
      LoginPage
    )
  })

  it("renders the public app for the app route", () => {
    expect(pageForRoute({ route: "app", variationId: null }).type).toBe(App)
  })
})
