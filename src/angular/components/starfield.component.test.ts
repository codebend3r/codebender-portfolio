import { TestBed } from "@angular/core/testing"
import { describe, expect, it, vi } from "vitest"

import { StarfieldComponent } from "@ngapp/components/starfield.component"

async function render() {
  await TestBed.configureTestingModule({
    imports: [StarfieldComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(StarfieldComponent)
  fixture.detectChanges()
  await fixture.whenStable()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("StarfieldComponent", () => {
  it("renders three parallax layers of stars", async () => {
    const root = await render()

    expect(root.querySelectorAll(".layer").length).toBe(3)
    expect(root.querySelectorAll(".star").length).toBe(160 + 80 + 30)
  })

  it("sizes stars from their layer config", async () => {
    const root = await render()
    const star = root.querySelector(".star")

    expect(star instanceof HTMLElement ? star.style.width : "").toMatch(/px$/)
    expect(star instanceof HTMLElement ? star.style.opacity : "").not.toBe("")
  })

  it("applies a parallax transform on scroll", async () => {
    const root = await render()

    Object.defineProperty(window, "scrollY", {
      value: 100,
      configurable: true,
    })
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0)
        return 1
      })
    window.dispatchEvent(new Event("scroll"))
    rafSpy.mockRestore()

    const layer = root.querySelector(".layer")
    expect(layer instanceof HTMLElement ? layer.style.transform : "").toContain(
      "translate3d"
    )
  })
})
