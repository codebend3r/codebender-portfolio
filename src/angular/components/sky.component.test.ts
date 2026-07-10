import { TestBed } from "@angular/core/testing"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SkyComponent } from "@ngapp/components/sky.component"

import { getCurrentSky } from "@sky"

vi.mock("@sky", () => ({
  getCurrentSky: vi.fn(() => "night"),
}))

const mockedGetCurrentSky = vi.mocked(getCurrentSky)

async function render() {
  await TestBed.configureTestingModule({
    imports: [SkyComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(SkyComponent)
  fixture.detectChanges()
  await fixture.whenStable()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("SkyComponent", () => {
  beforeEach(() => {
    mockedGetCurrentSky.mockReturnValue("night")
  })

  it("renders the starfield + moon at night", async () => {
    const root = await render()
    const stage = root.querySelector(".skyStage")

    expect(stage?.getAttribute("aria-hidden") ?? "").toBe("true")
    expect(stage?.querySelector("app-starfield")).not.toBeNull()
    expect(stage?.querySelector(".moon")).not.toBeNull()
    expect(stage?.querySelector(".sun")).toBeNull()
  })

  it("renders a sun + clouds during the day", async () => {
    mockedGetCurrentSky.mockReturnValue("day")
    const root = await render()
    const stage = root.querySelector(".skyStage")

    expect(stage?.querySelector(".sun.sunDay")).not.toBeNull()
    expect(stage?.querySelectorAll(".cloudsLayer").length).toBe(2)
    expect(stage?.querySelectorAll(".cloud").length).toBe(12)
    expect(stage?.querySelector(".moon")).toBeNull()
  })

  it("renders the dawn sun variant", async () => {
    mockedGetCurrentSky.mockReturnValue("dawn")
    const root = await render()
    expect(root.querySelector(".sun.sunDawn")).not.toBeNull()
  })

  it("renders the dusk sun variant", async () => {
    mockedGetCurrentSky.mockReturnValue("dusk")
    const root = await render()
    expect(root.querySelector(".sun.sunDusk")).not.toBeNull()
  })

  it("sets the cloud drift custom property", async () => {
    mockedGetCurrentSky.mockReturnValue("day")
    const root = await render()
    const cloud = root.querySelector(".cloud")

    expect(
      cloud instanceof HTMLElement
        ? cloud.style.getPropertyValue("--cloud-drift")
        : ""
    ).toMatch(/vw$/)
  })

  it("coalesces back-to-back cloud-parallax scrolls into one animation frame", async () => {
    mockedGetCurrentSky.mockReturnValue("day")
    await render()

    // Spy after render so Angular's own zoneless scheduler frames don't count.
    const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1)
    window.dispatchEvent(new Event("scroll"))
    window.dispatchEvent(new Event("scroll"))
    window.dispatchEvent(new Event("scroll"))

    expect(rafSpy).toHaveBeenCalledTimes(1)
    rafSpy.mockRestore()
  })
})
