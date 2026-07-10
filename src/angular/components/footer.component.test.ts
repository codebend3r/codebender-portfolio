import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { FooterComponent } from "@ngapp/components/footer.component"

async function render() {
  await TestBed.configureTestingModule({
    imports: [FooterComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(FooterComponent)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("FooterComponent", () => {
  it("names the Angular stack", async () => {
    const root = await render()
    expect(root.querySelector(".stack")?.textContent ?? "").toContain(
      "Built with Angular + Typescript + Vite"
    )
  })

  it("renders the current year", async () => {
    const root = await render()
    expect(root.querySelector(".year")?.textContent ?? "").toContain(
      String(new Date().getFullYear())
    )
  })

  it("credits the owner with a GitHub link", async () => {
    const root = await render()
    const github = resume.contact.find((entry) =>
      entry.value.includes("github.com")
    )
    const link = root.querySelector(".credit a")

    expect(root.querySelector(".credit")?.textContent ?? "").toContain(
      resume.name
    )
    expect(link?.getAttribute("href") ?? "").toBe(github?.value ?? "")
    expect(link?.getAttribute("target") ?? "").toBe("_blank")
  })
})
