import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

import GenerateApp from "@generate/GenerateApp"

import { useStore } from "@state/useStore"
import { useVariations } from "@state/useVariations"

import { navigate } from "@utils/navigate"

vi.mock("@utils/navigate", () => ({ navigate: vi.fn() }))

const okBody: GenerateResponse = {
  data: {
    ...(structuredClone(resume) as Data),
    name: "Generated Name",
  },
  suggestedName: "Frontend @ Acme",
}

beforeAll(async () => {
  if (!globalThis.crypto?.subtle) {
    const { webcrypto } = await import("node:crypto")
    Object.defineProperty(globalThis, "crypto", { value: webcrypto })
  }
})

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null })
  useStore.getState().loadData(structuredClone(resume) as Data)
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200, json: async () => okBody }))
  )
})

async function fillAndGenerate() {
  fireEvent.change(screen.getByRole("textbox", { name: /job posting/i }), {
    target: { value: "Senior Frontend Engineer at Acme" },
  })
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: "hunter2" },
  })
  fireEvent.click(screen.getByRole("button", { name: /^generate$/i }))
}

describe("GenerateApp", () => {
  it("generates and shows the preview with the suggested name", async () => {
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: /variation name/i })
      ).toHaveValue("Frontend @ Acme")
    )
  })

  it("saves a variation with hash meta and navigates to the editor", async () => {
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      screen.getByRole("textbox", { name: /variation name/i })
    )
    fireEvent.click(screen.getByRole("button", { name: /save & edit/i }))
    const state = useVariations.getState()
    expect(state.variations).toHaveLength(1)
    expect(state.variations[0].origin).toBe("generated")
    expect(state.variations[0].hash).toMatch(/^[0-9a-f]{12}$/)
    expect(state.variations[0].sourcePreview).toContain("Senior Frontend")
    expect(state.activeId).toBe(state.variations[0].id)
    expect(navigate).toHaveBeenCalledWith("/edit-resume")
  })

  it("offers to open an existing variation when the hash matches", async () => {
    render(<GenerateApp />)
    // Seed a variation whose hash equals the hash of the input we'll paste
    const { hashInput } = await import("@utils/hashInput")
    const hash = await hashInput({
      type: "text",
      text: "Senior Frontend Engineer at Acme",
    })
    useVariations
      .getState()
      .createVariation("Existing", structuredClone(resume) as Data, {
        hash,
        origin: "generated",
      })
    useVariations.getState().selectVariation(null)

    await fillAndGenerate()
    await waitFor(() =>
      expect(screen.getByText(/already generated/i)).toBeInTheDocument()
    )
    expect(fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: /open existing/i }))
    expect(navigate).toHaveBeenCalledWith("/edit-resume")
  })

  it("shows the error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: "unauthorized" }),
      }))
    )
    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      expect(screen.getByText(/wrong password/i)).toBeInTheDocument()
    )
  })

  it("freezes hash and sourcePreview at generate time", async () => {
    let resolveFetch!: (value: unknown) => void
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise((resolve) => (resolveFetch = resolve)))
    )
    render(<GenerateApp />)
    fireEvent.change(screen.getByRole("textbox", { name: /job posting/i }), {
      target: { value: "Original posting" },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "hunter2" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^generate$/i }))
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    fireEvent.change(screen.getByRole("textbox", { name: /job posting/i }), {
      target: { value: "Edited during flight" },
    })
    resolveFetch({ ok: true, status: 200, json: async () => okBody })
    await waitFor(() =>
      screen.getByRole("textbox", { name: /variation name/i })
    )
    fireEvent.click(screen.getByRole("button", { name: /save & edit/i }))

    const { hashInput } = await import("@utils/hashInput")
    const v = useVariations.getState().variations[0]
    expect(v.sourcePreview).toContain("Original posting")
    expect(v.hash).toBe(
      await hashInput({ type: "text", text: "Original posting" })
    )
  })

  it("clears the dedupe notice when the input changes", async () => {
    const { hashInput } = await import("@utils/hashInput")
    const hash = await hashInput({
      type: "text",
      text: "Senior Frontend Engineer at Acme",
    })
    useVariations
      .getState()
      .createVariation("Existing", structuredClone(resume) as Data, { hash })
    useVariations.getState().selectVariation(null)

    render(<GenerateApp />)
    await fillAndGenerate()
    await waitFor(() =>
      expect(screen.getByText(/already generated/i)).toBeInTheDocument()
    )

    fireEvent.change(screen.getByRole("textbox", { name: /job posting/i }), {
      target: { value: "A different posting" },
    })
    expect(screen.queryByText(/already generated/i)).not.toBeInTheDocument()
  })
})
