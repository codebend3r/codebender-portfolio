import { signal } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import type { Session } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import { SideMenuComponent } from "@ngapp/components/side-menu.component"
import { AuthService } from "@ngapp/services/auth.service"

type FakeAuth = {
  cloudConfigured: boolean
  session: ReturnType<typeof signal<Session | null>>
  ready: ReturnType<typeof signal<boolean>>
  signOut: ReturnType<typeof vi.fn>
}

function makeAuth({ cloudConfigured = true } = {}): FakeAuth {
  return {
    cloudConfigured,
    session: signal<Session | null>(null),
    ready: signal(true),
    signOut: vi.fn(async () => {}),
  }
}

async function render(auth: FakeAuth) {
  await TestBed.configureTestingModule({
    imports: [SideMenuComponent],
    providers: [{ provide: AuthService, useValue: auth }],
  }).compileComponents()
  const fixture = TestBed.createComponent(SideMenuComponent)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return { root, fixture }
}

function signedIn(auth: FakeAuth) {
  auth.session.set({} as Session)
}

describe("SideMenuComponent", () => {
  it("renders nothing for anonymous visitors", async () => {
    const { root } = await render(makeAuth())
    expect(root.querySelector(".toggle")).toBeNull()
  })

  it("renders nothing when cloud is not configured", async () => {
    const auth = makeAuth({ cloudConfigured: false })
    signedIn(auth)
    const { root } = await render(auth)
    expect(root.querySelector(".toggle")).toBeNull()
  })

  it("shows a toggle when signed in and opens the drawer", async () => {
    const auth = makeAuth()
    signedIn(auth)
    const { root, fixture } = await render(auth)

    const toggle = root.querySelector("button.toggle")
    expect(toggle).not.toBeNull()
    if (toggle instanceof HTMLElement) toggle.click()
    fixture.detectChanges()

    const nav = root.querySelector('nav[aria-label="Site"]')
    expect(nav).not.toBeNull()
    const hrefs = [...(nav?.querySelectorAll("a.link") ?? [])].map(
      (a) => a.getAttribute("href") ?? ""
    )
    expect(hrefs).toEqual(["/", "/edit-resume", "/generate"])
  })

  it("marks the Home route current on this page", async () => {
    // `routeFor` maps unknown paths (like /angular-version) to the app route.
    const auth = makeAuth()
    signedIn(auth)
    const { root, fixture } = await render(auth)

    const toggle = root.querySelector("button.toggle")
    if (toggle instanceof HTMLElement) toggle.click()
    fixture.detectChanges()

    expect(
      root.querySelector('a[aria-current="page"]')?.getAttribute("href") ?? ""
    ).toBe("/")
  })

  it("closes on Escape", async () => {
    const auth = makeAuth()
    signedIn(auth)
    const { root, fixture } = await render(auth)

    const toggle = root.querySelector("button.toggle")
    if (toggle instanceof HTMLElement) toggle.click()
    fixture.detectChanges()
    expect(root.querySelector("nav")).not.toBeNull()

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    fixture.detectChanges()
    expect(root.querySelector("nav")).toBeNull()
  })

  it("signs out from the drawer", async () => {
    const auth = makeAuth()
    signedIn(auth)
    const { root, fixture } = await render(auth)

    const toggle = root.querySelector("button.toggle")
    if (toggle instanceof HTMLElement) toggle.click()
    fixture.detectChanges()

    const signOut = root.querySelector("button.signOut")
    if (signOut instanceof HTMLElement) signOut.click()

    expect(auth.signOut).toHaveBeenCalledOnce()
  })
})
