import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { ShowcaseComponent } from "@ngapp/components/showcase.component"

async function render() {
  await TestBed.configureTestingModule({
    imports: [ShowcaseComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(ShowcaseComponent)
  fixture.componentRef.setInput("index", 3)
  fixture.componentRef.setInput("eyebrow", "Selected Work")
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("ShowcaseComponent", () => {
  it("renders inside a Selected Work section", async () => {
    const root = await render()
    expect(root.querySelector("section")?.id ?? "").toBe("selected-work")
  })

  it("renders one linked card per showcase item", async () => {
    const root = await render()
    const cards = [...root.querySelectorAll("a.card")]

    expect(cards.length).toBe(resume.showcase.length)
    expect(cards[0]?.getAttribute("href") ?? "").toBe(
      resume.showcase[0]?.url ?? ""
    )
    expect(cards[0]?.getAttribute("target") ?? "").toBe("_blank")
    expect(cards[0]?.getAttribute("rel") ?? "").toBe("noopener noreferrer")
  })

  it("renders period, domain, description, and tags for the first card", async () => {
    const root = await render()
    const card = root.querySelector("a.card")
    const item = resume.showcase[0]

    expect(card?.querySelector(".period")?.textContent?.trim() ?? "").toBe(
      item?.period ?? ""
    )
    expect(card?.querySelector(".domain")?.textContent?.trim() ?? "").toBe(
      item?.domain ?? ""
    )
    expect(card?.querySelector(".description")?.textContent?.trim() ?? "").toBe(
      item?.description ?? ""
    )
    expect(card?.querySelectorAll(".tag").length).toBe(item?.tags.length ?? 0)
  })

  it("gives each screenshot a non-empty alt", async () => {
    const root = await render()
    const images = [...root.querySelectorAll(".shot img")]

    expect(images.length).toBe(resume.showcase.length)
    images.forEach((img) => {
      expect(img.getAttribute("alt") ?? "").not.toBe("")
      expect(img.getAttribute("loading") ?? "").toBe("lazy")
    })
  })

  it("renders a numbered eyebrow chip", async () => {
    const root = await render()
    expect(root.querySelector(".chip")?.textContent ?? "").toContain(
      "03 · Selected Work"
    )
  })
})
