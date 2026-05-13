import { describe, expect, it, vi } from "vitest"

import { waitForAssets } from "@utils/print-utils"

describe("waitForAssets", () => {
  it("resolves immediately when no images are present", async () => {
    const root = document.createElement("div")
    await expect(waitForAssets(root)).resolves.toBeUndefined()
  })

  it("resolves immediately for images that are already complete", async () => {
    const root = document.createElement("div")
    const img = document.createElement("img")
    Object.defineProperty(img, "complete", { value: true })
    root.appendChild(img)
    await expect(waitForAssets(root)).resolves.toBeUndefined()
  })

  it("waits for 'load' on pending images", async () => {
    const root = document.createElement("div")
    const img = document.createElement("img")
    Object.defineProperty(img, "complete", { value: false })
    root.appendChild(img)

    const pending = waitForAssets(root)
    let settled = false
    void pending.then(() => {
      settled = true
    })

    await Promise.resolve()
    expect(settled).toBe(false)
    img.dispatchEvent(new Event("load"))
    await expect(pending).resolves.toBeUndefined()
    expect(settled).toBe(true)
  })

  it("resolves on 'error' too, so a broken image does not hang", async () => {
    const root = document.createElement("div")
    const img = document.createElement("img")
    Object.defineProperty(img, "complete", { value: false })
    root.appendChild(img)

    const pending = waitForAssets(root)
    await Promise.resolve()
    img.dispatchEvent(new Event("error"))
    await expect(pending).resolves.toBeUndefined()
  })

  it("awaits document.fonts.ready when available", async () => {
    const root = document.createElement("div")
    const fontsReady = Promise.resolve()
    const ready = vi.fn().mockReturnValue(fontsReady)
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: ready() },
    })
    await expect(waitForAssets(root)).resolves.toBeUndefined()
    Reflect.deleteProperty(document, "fonts")
  })
})
