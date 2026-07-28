import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { downloadBlob } from "@utils/downloadBlob"

describe("downloadBlob", () => {
  const createObjectURL = vi.fn(() => "blob:mock-url")
  const revokeObjectURL = vi.fn()
  const clicked: HTMLAnchorElement[] = []
  let connectedAtClick = false

  beforeEach(() => {
    clicked.length = 0
    connectedAtClick = false
    // jsdom does not implement object URLs; stub the two statics used.
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        clicked.push(this)
        connectedAtClick = this.isConnected
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("clicks a temporary anchor pointing at the blob URL", () => {
    const blob = new Blob(["hello"], { type: "text/plain" })
    downloadBlob(blob, "resume.pdf")

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(clicked).toHaveLength(1)
    expect(clicked[0].getAttribute("href")).toBe("blob:mock-url")
    expect(clicked[0].getAttribute("download")).toBe("resume.pdf")
  })

  it("attaches the anchor for the click and removes it afterwards", () => {
    downloadBlob(new Blob(["x"]), "file.txt")

    expect(connectedAtClick).toBe(true)
    expect(document.body.contains(clicked[0])).toBe(false)
  })

  it("revokes the object URL after downloading", () => {
    downloadBlob(new Blob(["x"]), "file.txt")

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
  })
})
