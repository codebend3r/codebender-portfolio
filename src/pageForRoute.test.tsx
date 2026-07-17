import type { ReactElement } from "react"
import { isValidElement } from "react"

import App from "@App"
import { describe, expect, it } from "vitest"

import { AuthGate } from "@components/AuthGate"
import { LoginPage } from "@components/LoginPage"

import EditResumeApp from "@edit/EditResumeApp"

import GenerateApp from "@generate/GenerateApp"

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
    const page = pageForRoute("edit")
    expect(page.type).toBe(AuthGate)
    expect(childElement(page)?.type ?? null).toBe(EditResumeApp)
  })

  it("wraps the proximate generate page in an auth gate", () => {
    const page = pageForRoute("generate-proximate")
    expect(page.type).toBe(AuthGate)
    const child = childElement(page)
    expect(child?.type ?? null).toBe(GenerateApp)
    expect(child?.props ?? null).toMatchObject({ mode: "proximate" })
  })

  it("wraps the exact generate page in an auth gate", () => {
    const page = pageForRoute("generate-exact")
    expect(page.type).toBe(AuthGate)
    const child = childElement(page)
    expect(child?.type ?? null).toBe(GenerateApp)
    expect(child?.props ?? null).toMatchObject({ mode: "exact" })
  })

  it("renders the login page without an auth gate", () => {
    expect(pageForRoute("login").type).toBe(LoginPage)
  })

  it("renders the public app for the app route", () => {
    expect(pageForRoute("app").type).toBe(App)
  })

  it("falls back to the public app for the angular-version route", () => {
    expect(pageForRoute("angular-version").type).toBe(App)
  })
})
