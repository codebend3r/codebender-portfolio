import { TestBed } from "@angular/core/testing"
import { describe, expect, it } from "vitest"

import { AppComponent } from "@ngapp/app.component"

describe("AppComponent", () => {
  it("renders", async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents()

    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()

    const root: HTMLElement = fixture.nativeElement
    expect(root.textContent).toContain("Angular version")
  })
})
