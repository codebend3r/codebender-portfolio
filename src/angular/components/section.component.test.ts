import { Component } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import { SectionComponent } from "@ngapp/components/section.component"

@Component({
  imports: [SectionComponent],
  template: `
    <app-section title="Technical Skills" [index]="1" eyebrow="Stack">
      <p>Projected body</p>
    </app-section>
  `,
})
class ChippedHost {}

@Component({
  imports: [SectionComponent],
  template: `
    <app-section title="Summary">
      <p>Plain body</p>
    </app-section>
  `,
})
class PlainHost {}

async function render(host: typeof ChippedHost | typeof PlainHost) {
  await TestBed.configureTestingModule({ imports: [host] }).compileComponents()
  const fixture = TestBed.createComponent(host)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("SectionComponent", () => {
  it("renders a section with a slugified id and sr-only title", async () => {
    const root = await render(ChippedHost)
    const section = root.querySelector("section")

    expect(section?.id ?? "").toBe("technical-skills")
    expect(section?.querySelector("h2")?.textContent ?? "").toBe(
      "Technical Skills"
    )
  })

  it("projects its content", async () => {
    const root = await render(ChippedHost)
    expect(root.textContent).toContain("Projected body")
  })

  it("renders a numbered eyebrow chip when index and eyebrow are passed", async () => {
    const root = await render(ChippedHost)
    const chip = root.querySelector(".chip")

    expect(chip?.textContent ?? "").toContain("01 · Stack")
  })

  it("omits the chip without index and eyebrow", async () => {
    const root = await render(PlainHost)

    expect(root.querySelector(".chip")).toBeNull()
    expect(root.querySelector("section")?.id ?? "").toBe("summary")
  })
})
