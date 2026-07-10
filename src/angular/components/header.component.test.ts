import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import resume from "@data/resume.json"

import { HeaderComponent } from "@ngapp/components/header.component"

async function render() {
  await TestBed.configureTestingModule({
    imports: [HeaderComponent],
  }).compileComponents()
  const fixture = TestBed.createComponent(HeaderComponent)
  fixture.detectChanges()
  const root: HTMLElement = fixture.nativeElement
  return root
}

describe("HeaderComponent", () => {
  it("renders the name as the page heading", async () => {
    const root = await render()
    expect(root.querySelector("h1")?.textContent?.trim() ?? "").toBe(
      resume.name
    )
  })

  it("renders the title as subtitle", async () => {
    const root = await render()
    expect(root.querySelector(".subtitle")?.textContent?.trim() ?? "").toBe(
      resume.title
    )
  })

  it("renders an email mailto: link", async () => {
    const root = await render()
    const email = resume.contact.find((entry) => entry.label === "Email")
    const link = root.querySelector(`a[href="mailto:${email?.value ?? ""}"]`)
    expect(link).not.toBeNull()
  })

  it("renders a phone tel: link", async () => {
    const root = await render()
    const phone = resume.contact.find((entry) => entry.label === "Phone")
    const link = root.querySelector(`a[href="tel:${phone?.value ?? ""}"]`)
    expect(link).not.toBeNull()
  })

  it("renders the location as plain text", async () => {
    const root = await render()
    const location = resume.contact.find((entry) => entry.label === "Location")
    expect(root.querySelector(".location")?.textContent?.trim() ?? "").toBe(
      location?.value ?? ""
    )
  })

  it("renders a GitHub link that opens in a new tab safely", async () => {
    const root = await render()
    const github = resume.contact.find((entry) => entry.label === "GitHub")
    const link = root.querySelector(`a[href="${github?.value ?? ""}"]`)

    expect(link?.getAttribute("target") ?? "").toBe("_blank")
    expect(link?.getAttribute("rel") ?? "").toBe("noopener noreferrer")
    expect(link?.textContent ?? "").toContain("GitHub")
  })

  it("renders contact entries in data order", async () => {
    const root = await render()
    const rendered = [
      ...root.querySelectorAll(".contact a, .contact .location"),
    ]
    expect(rendered.length).toBe(resume.contact.length)
  })

  it("renders the logo with alt text", async () => {
    const root = await render()
    const logo = root.querySelector("img.logo")
    expect(logo?.getAttribute("alt") ?? "").toBe("Logo")
    expect(logo?.getAttribute("src") ?? "").not.toBe("")
  })
})
