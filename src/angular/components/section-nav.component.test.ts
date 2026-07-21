import { TestBed } from "@angular/core/testing"
import { describe, expect, it, vi } from "vitest"

import { SectionNavComponent } from "@ngapp/components/section-nav.component"

async function render() {
  await TestBed.configureTestingModule({
    imports: [SectionNavComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(SectionNavComponent)
  fixture.detectChanges()
  await fixture.whenStable()
  const root: HTMLElement = fixture.nativeElement
  return { root, fixture }
}

describe("SectionNavComponent", () => {
  it("renders one link per section", async () => {
    const { root } = await render()
    const links = [...root.querySelectorAll("a.item")]

    expect(links.length).toBe(8)
    expect(links[0]?.getAttribute("href") ?? "").toBe("#summary")
    expect(links[1]?.getAttribute("href") ?? "").toBe("#technical-skills")
  })

  it("marks the first section active initially", async () => {
    const { root } = await render()
    const active = root.querySelector('a[aria-current="true"]')

    expect(active?.getAttribute("href") ?? "").toBe("#summary")
  })

  it("shows chip numbers for numbered sections and a dot for summary", async () => {
    const { root } = await render()

    expect(root.querySelectorAll(".num").length).toBe(7)
    expect(root.querySelectorAll(".dot").length).toBe(1)
    expect(
      [...root.querySelectorAll(".num")][0]?.textContent?.trim() ?? ""
    ).toBe("01")
  })

  it("activates a section on click", async () => {
    const { root, fixture } = await render()
    const target = document.createElement("section")
    target.id = "education"
    // jsdom has no scrollIntoView implementation.
    target.scrollIntoView = vi.fn()
    document.body.appendChild(target)

    const link = [...root.querySelectorAll("a.item")].find(
      (a) => a.getAttribute("href") === "#education"
    )
    if (link instanceof HTMLElement) link.click()
    fixture.detectChanges()

    expect(
      root.querySelector('a[aria-current="true"]')?.getAttribute("href") ?? ""
    ).toBe("#education")
    target.remove()
  })
})
